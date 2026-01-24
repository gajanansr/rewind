package com.rewind.config;

import com.rewind.model.User;
import com.rewind.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Interceptor that checks if user has active subscription for PREMIUM features.
 * Returns 402 Payment Required if subscription is expired for premium
 * endpoints.
 * 
 * FREEMIUM MODEL:
 * - FREE: Dashboard, Questions list, basic question marking, profile
 * - PREMIUM: Recording analysis (AI feedback), Learn page, Revisions tracking
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionInterceptor implements HandlerInterceptor {

    private final SubscriptionService subscriptionService;

    // Premium endpoints that REQUIRE subscription
    private static final Set<String> PREMIUM_PATHS = Set.of(
            "/api/v1/recordings", // AI analysis of recordings
            "/api/v1/feedback", // AI feedback
            "/api/v1/learn", // Learn feature
            "/api/v1/analytics" // Detailed analytics
    );

    // Premium POST/PUT operations
    private static final Set<String> PREMIUM_WRITE_PATHS = Set.of(
            "/api/v1/revisions" // Creating/updating revisions requires premium
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Only check subscription for premium paths
        if (!isPremiumPath(path, method)) {
            return true;
        }

        // Get authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            // Not authenticated - let security handle it
            return true;
        }

        User user = (User) auth.getPrincipal();

        // Check subscription status
        boolean hasActiveSubscription = subscriptionService.isSubscriptionActive(user.getId());

        if (!hasActiveSubscription) {
            log.info("User {} blocked from premium feature. Path: {}", user.getId(), path);
            response.setStatus(HttpServletResponse.SC_PAYMENT_REQUIRED); // 402
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Premium feature\",\"code\":\"SUBSCRIPTION_REQUIRED\",\"message\":\"This is a premium feature. Please upgrade to access.\"}");
            return false;
        }

        return true;
    }

    /**
     * Check if the path requires premium subscription.
     * Uses whitelist approach - only specific paths require subscription.
     */
    private boolean isPremiumPath(String path, String method) {
        // Check if it's a premium path
        boolean isPremium = PREMIUM_PATHS.stream().anyMatch(path::startsWith);

        // Check if it's a premium write operation
        if (!isPremium && !method.equalsIgnoreCase("GET")) {
            isPremium = PREMIUM_WRITE_PATHS.stream().anyMatch(path::startsWith);
        }

        return isPremium;
    }
}
