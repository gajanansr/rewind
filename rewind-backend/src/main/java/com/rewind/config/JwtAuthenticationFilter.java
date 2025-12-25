package com.rewind.config;

import com.rewind.model.User;
import com.rewind.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    private final UserRepository userRepository;

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

                // Get or create user in our database
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
            SecretKey key = getSigningKey();

            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            logger.error("Invalid JWT token: " + e.getMessage());
            return null;
        }
    }

    private SecretKey getSigningKey() {
        // Try to decode as base64 first (Supabase provides base64-encoded secrets)
        try {
            byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            // If not valid base64, use the raw secret bytes
            return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        }
    }

    @SuppressWarnings("unchecked")
    private User createUserFromClaims(UUID userId, Claims claims) {
        String email = claims.get("email", String.class);

        // Try to get name from user_metadata or app_metadata
        String name = null;
        Object userMetadata = claims.get("user_metadata");
        if (userMetadata instanceof java.util.Map) {
            name = (String) ((java.util.Map<String, Object>) userMetadata).get("name");
            if (name == null) {
                name = (String) ((java.util.Map<String, Object>) userMetadata).get("full_name");
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
