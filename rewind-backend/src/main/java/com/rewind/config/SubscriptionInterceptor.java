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
 * Interceptor that checks if user has active subscription before allowing
 * access
 * to protected endpoints. Returns 402 Payment Required if subscription is
 * expired.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionInterceptor implements HandlerInterceptor {

    private final SubscriptionService subscriptionService;

    // Endpoints that don't require subscription (public or subscription-related)
    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/v1/auth",
            "/api/v1/subscription",
            "/api/v1/payments",
            "/api/v1/webhooks",
            "/api/v1/questions", // Allow viewing questions (read-only)
            "/api/v1/patterns", // Allow viewing patterns
            "/health",
            "/actuator");

    // Specific methods that are exempt (e.g., GET requests for browsing)
    private static final Set<String> EXEMPT_GET_PATHS = Set.of(
            "/api/v1/user-questions/status-map", // Allow status check
            "/api/v1/revisions/pending", // Allow viewing pending revisions
            "/api/v1/revisions/today" // Allow viewing today's revisions
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

        // Check if path is exempt
        if (isExemptPath(path)) {
            return true;
        }

        // Check if it's an exempt GET request
        if ("GET".equalsIgnoreCase(method) && isExemptGetPath(path)) {
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
            log.info("User {} blocked due to expired subscription for path: {}", user.getId(), path);
            response.setStatus(HttpServletResponse.SC_PAYMENT_REQUIRED); // 402
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Subscription required\",\"code\":\"SUBSCRIPTION_EXPIRED\",\"message\":\"Your subscription has expired. Please upgrade to continue.\"}");
            return false;
        }

        return true;
    }

    private boolean isExemptPath(String path) {
        return EXEMPT_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isExemptGetPath(String path) {
        return EXEMPT_GET_PATHS.stream().anyMatch(path::startsWith);
    }
}
