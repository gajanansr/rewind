package com.rewind.controller;

import com.rewind.model.User;
import com.rewind.service.SubscriptionService;
import com.rewind.service.SubscriptionService.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Get current subscription status.
     * Returns plan, status, days remaining, expiry date.
     */
    @GetMapping
    public ResponseEntity<SubscriptionStatus> getSubscriptionStatus(
            @AuthenticationPrincipal User user) {
        SubscriptionStatus status = subscriptionService.getSubscriptionStatus(user.getId());
        return ResponseEntity.ok(status);
    }

    /**
     * Cancel subscription (stop auto-renewal).
     */
    @PostMapping("/cancel")
    public ResponseEntity<Void> cancelSubscription(
            @AuthenticationPrincipal User user) {
        subscriptionService.cancelSubscription(user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Check if subscription is active (quick check for frontend).
     */
    @GetMapping("/active")
    public ResponseEntity<ActiveCheckResponse> isActive(
            @AuthenticationPrincipal User user) {
        boolean active = subscriptionService.isSubscriptionActive(user.getId());
        long daysRemaining = subscriptionService.getDaysRemaining(user.getId());
        return ResponseEntity.ok(new ActiveCheckResponse(active, daysRemaining));
    }

    public record ActiveCheckResponse(boolean active, long daysRemaining) {
    }
}
