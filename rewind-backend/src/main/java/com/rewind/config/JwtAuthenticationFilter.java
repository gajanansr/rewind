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

    private ECPublicKey cachedPublicKey;
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

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = validateToken(token);

            if (claims != null) {
                String userId = claims.getSubject();
                UUID userUuid = UUID.fromString(userId);

                User user = userRepository.findById(userUuid)
                        .orElseGet(() -> createUserFromClaims(userUuid, claims));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Authenticated user: " + userId);
            }
        } catch (Exception e) {
            logger.error("Cannot authenticate user: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private Claims validateToken(String token) {
        try {
            ECPublicKey publicKey = getPublicKey();
            if (publicKey == null) {
                logger.error("Could not get public key from Supabase");
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

    private ECPublicKey getPublicKey() {
        // Use cached key if still valid
        if (cachedPublicKey != null && System.currentTimeMillis() < cacheExpiry) {
            return cachedPublicKey;
        }

        try {
            // Fetch JWKS from Supabase
            String jwksUrl = supabaseUrl + "/auth/v1/.well-known/jwks.json";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(jwksUrl))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("Failed to fetch JWKS: " + response.statusCode());
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> jwks = objectMapper.readValue(response.body(), Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> keys = (List<Map<String, Object>>) jwks.get("keys");

            if (keys == null || keys.isEmpty()) {
                logger.error("No keys found in JWKS");
                return null;
            }

            // Get the first key (signing key)
            Map<String, Object> key = keys.get(0);
            String kty = (String) key.get("kty");

            if (!"EC".equals(kty)) {
                logger.error("Unexpected key type: " + kty);
                return null;
            }

            String xStr = (String) key.get("x");
            String yStr = (String) key.get("y");

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
            cachedPublicKey = (ECPublicKey) keyFactory.generatePublic(pubKeySpec);
            cacheExpiry = System.currentTimeMillis() + CACHE_DURATION_MS;

            logger.info("Successfully fetched and cached Supabase public key");
            return cachedPublicKey;

        } catch (Exception e) {
            logger.error("Error fetching public key: " + e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private User createUserFromClaims(UUID userId, Claims claims) {
        String email = claims.get("email", String.class);

        String name = null;
        Object userMetadata = claims.get("user_metadata");
        if (userMetadata instanceof Map) {
            name = (String) ((Map<String, Object>) userMetadata).get("name");
            if (name == null) {
                name = (String) ((Map<String, Object>) userMetadata).get("full_name");
            }
        }

        User user = User.builder()
                .id(userId)
                .email(email != null ? email : "unknown@example.com")
                .name(name)
                .currentReadinessDays(90)
                .interviewTargetDays(90)
                .build();

        return userRepository.save(user);
    }
}
