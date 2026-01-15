package com.rewind.config;

import com.rewind.model.User;
import com.rewind.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.*;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${supabase.url}")
    private String supabaseUrl;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    // Cache keys by kid (key ID) to support multiple/rotated keys
    private Map<String, ECPublicKey> cachedKeys = new HashMap<>();
    private long cacheExpiry = 0;
    private static final long CACHE_DURATION_MS = 3600000; // 1 hour

    public JwtAuthenticationFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String requestUri = request.getRequestURI();

        logger.info("JWT Filter processing: " + requestUri);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.debug("No Authorization header for: " + requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        logger.info("Processing token for: " + requestUri);

        try {
            String token = authHeader.substring(7);
            logger.debug("Token length: " + token.length());

            Claims claims = validateToken(token);

            if (claims != null) {
                String userId = claims.getSubject();
                logger.info("Token validated for user: " + userId);
                UUID userUuid = UUID.fromString(userId);

                User user = userRepository.findById(userUuid)
                        .orElseGet(() -> createUserFromClaims(userUuid, claims));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("Authenticated user: " + userId + " for " + requestUri);
            } else {
                logger.warn("Token validation returned null for: " + requestUri);
            }
        } catch (Exception e) {
            logger.error("Cannot authenticate user for " + requestUri + ": " + e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    private Claims validateToken(String token) {
        try {
            // Extract kid from JWT header to find the correct public key
            String kid = extractKidFromToken(token);
            if (kid == null) {
                logger.error("Could not extract kid from token header");
                return null;
            }
            logger.debug("Token kid: " + kid);

            ECPublicKey publicKey = getPublicKeyByKid(kid);
            if (publicKey == null) {
                logger.error("Could not get public key for kid: " + kid);
                return null;
            }

            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            logger.error("Invalid JWT token: " + e.getMessage());
            return null;
        }
    }

    private String extractKidFromToken(String token) {
        try {
            // JWT format: header.payload.signature - we only need the header
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            @SuppressWarnings("unchecked")
            Map<String, Object> header = objectMapper.readValue(headerJson, Map.class);
            return (String) header.get("kid");
        } catch (Exception e) {
            logger.error("Error extracting kid from token: " + e.getMessage());
            return null;
        }
    }

    private ECPublicKey getPublicKeyByKid(String kid) {
        // Refresh cache if expired
        if (System.currentTimeMillis() >= cacheExpiry) {
            refreshKeyCache();
        }

        // Return key from cache
        ECPublicKey key = cachedKeys.get(kid);
        if (key == null) {
            // Key not in cache, try refreshing once more
            logger.info("Key not found for kid: " + kid + ", refreshing cache...");
            refreshKeyCache();
            key = cachedKeys.get(kid);
        }
        return key;
    }

    private void refreshKeyCache() {
        try {
            String jwksUrl = supabaseUrl + "/auth/v1/.well-known/jwks.json";
            logger.info("Fetching JWKS from: " + jwksUrl);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(jwksUrl))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            logger.info("JWKS response status: " + response.statusCode());

            if (response.statusCode() != 200) {
                logger.error("Failed to fetch JWKS: " + response.statusCode() + " - Body: " + response.body());
                return;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> jwks = objectMapper.readValue(response.body(), Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> keys = (List<Map<String, Object>>) jwks.get("keys");

            if (keys == null || keys.isEmpty()) {
                logger.error("No keys found in JWKS");
                return;
            }

            // Cache ALL keys by their kid
            Map<String, ECPublicKey> newCache = new HashMap<>();
            for (Map<String, Object> keyData : keys) {
                String keyKid = (String) keyData.get("kid");
                String kty = (String) keyData.get("kty");

                if (!"EC".equals(kty)) {
                    logger.warn("Skipping non-EC key: " + keyKid);
                    continue;
                }

                try {
                    ECPublicKey publicKey = buildECPublicKey(keyData);
                    newCache.put(keyKid, publicKey);
                    logger.info("Cached key with kid: " + keyKid);
                } catch (Exception e) {
                    logger.error("Error building key for kid " + keyKid + ": " + e.getMessage());
                }
            }

            cachedKeys = newCache;
            cacheExpiry = System.currentTimeMillis() + CACHE_DURATION_MS;
            logger.info("Successfully cached " + newCache.size() + " keys from JWKS");

        } catch (Exception e) {
            logger.error("Error refreshing key cache: " + e.getMessage());
        }
    }

    private ECPublicKey buildECPublicKey(Map<String, Object> keyData) throws Exception {
        String xStr = (String) keyData.get("x");
        String yStr = (String) keyData.get("y");

        byte[] xBytes = Base64.getUrlDecoder().decode(xStr);
        byte[] yBytes = Base64.getUrlDecoder().decode(yStr);

        BigInteger x = new BigInteger(1, xBytes);
        BigInteger y = new BigInteger(1, yBytes);

        // P-256 curve parameters
        KeyFactory keyFactory = KeyFactory.getInstance("EC");
        java.security.spec.ECGenParameterSpec ecSpec = new java.security.spec.ECGenParameterSpec("secp256r1");
        java.security.AlgorithmParameters params = java.security.AlgorithmParameters.getInstance("EC");
        params.init(ecSpec);
        ECParameterSpec ecParams = params.getParameterSpec(ECParameterSpec.class);

        ECPoint point = new ECPoint(x, y);
        ECPublicKeySpec pubKeySpec = new ECPublicKeySpec(point, ecParams);
        return (ECPublicKey) keyFactory.generatePublic(pubKeySpec);
    }

    @SuppressWarnings("unchecked")
    private User createUserFromClaims(UUID userId, Claims claims) {
        String email = claims.get("email", String.class);

        String name = null;
        double targetDays = 90.0; // Default value

        Object userMetadata = claims.get("user_metadata");
        if (userMetadata instanceof Map) {
            Map<String, Object> metadata = (Map<String, Object>) userMetadata;

            // Get name
            name = (String) metadata.get("name");
            if (name == null) {
                name = (String) metadata.get("full_name");
            }

            // Get target_days from signup
            Object targetDaysObj = metadata.get("target_days");
            if (targetDaysObj instanceof Number) {
                targetDays = ((Number) targetDaysObj).doubleValue();
            }
        }

        User user = User.builder()
                .id(userId)
                .email(email != null ? email : "unknown@example.com")
                .name(name)
                .currentReadinessDays(targetDays)
                .interviewTargetDays(targetDays)
                .build();

        return userRepository.save(user);
    }
}
