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

import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.security.Key;
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

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                        Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Cannot authenticate user", e);
        }

        filterChain.doFilter(request, response);
    }

    private Claims validateToken(String token) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
            Key key = new SecretKeySpec(keyBytes, "HmacSHA256");

            return Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            logger.error("Invalid JWT token", e);
            return null;
        }
    }

    private User createUserFromClaims(UUID userId, Claims claims) {
        String email = claims.get("email", String.class);
        String name = claims.get("user_metadata", java.util.Map.class) != null
                ? (String) ((java.util.Map<?, ?>) claims.get("user_metadata")).get("name")
                : null;

        User user = User.builder()
                .id(userId)
                .email(email != null ? email : "unknown@example.com")
                .name(name)
                .build();

        return userRepository.save(user);
    }
}
