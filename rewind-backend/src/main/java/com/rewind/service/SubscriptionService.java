package com.rewind.service;

import com.rewind.model.Payment;
import com.rewind.model.Subscription;
import com.rewind.model.User;
import com.rewind.repository.PaymentRepository;
import com.rewind.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Get the active subscription for a user.
     */
    public Optional<Subscription> getActiveSubscription(UUID userId) {
        return subscriptionRepository.findActiveByUserId(userId)
                .filter(Subscription::isActive);
    }

    /**
     * Check if user has an active subscription (not expired).
     */
    public boolean isSubscriptionActive(UUID userId) {
        return subscriptionRepository.hasActiveSubscription(userId, Instant.now());
    }

    /**
     * Get days remaining in subscription.
     */
    public long getDaysRemaining(UUID userId) {
        return getActiveSubscription(userId)
                .map(Subscription::getDaysRemaining)
                .orElse(0L);
    }

    /**
     * Create a free trial subscription for a new user.
     * Called during user registration.
     */
    @Transactional
    public Subscription createTrialSubscription(User user) {
        // Check if user already has any subscription (prevent duplicate trials)
        Optional<Subscription> existing = subscriptionRepository.findActiveByUserId(user.getId());
        if (existing.isPresent()) {
            log.warn("User {} already has an active subscription", user.getId());
            return existing.get();
        }

        // Check if user has ever paid (returning users shouldn't get trial)
        boolean hasPaidBefore = paymentRepository.existsByUserIdAndStatus(user.getId(), Payment.Status.SUCCESS);
        if (hasPaidBefore) {
            log.info("User {} has paid before, not eligible for trial", user.getId());
            // Create an expired trial so they have to pay
            Subscription expiredTrial = Subscription.builder()
                    .user(user)
                    .plan(Subscription.Plan.TRIAL)
                    .status(Subscription.Status.EXPIRED)
                    .startsAt(Instant.now())
                    .expiresAt(Instant.now())
                    .build();
            return subscriptionRepository.save(expiredTrial);
        }

        // Create 14-day trial
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Subscription.getDurationDays(Subscription.Plan.TRIAL), ChronoUnit.DAYS);

        Subscription trial = Subscription.builder()
                .user(user)
                .plan(Subscription.Plan.TRIAL)
                .status(Subscription.Status.ACTIVE)
                .startsAt(now)
                .expiresAt(expiresAt)
                .build();

        log.info("Created trial subscription for user {} expiring at {}", user.getId(), expiresAt);
        return subscriptionRepository.save(trial);
    }

    /**
     * Activate a paid subscription after successful payment.
     */
    @Transactional
    public Subscription activateSubscription(User user, Subscription.Plan plan, Payment payment) {
        // Expire any existing active subscription
        subscriptionRepository.findActiveByUserId(user.getId())
                .ifPresent(existing -> {
                    existing.markExpired();
                    subscriptionRepository.save(existing);
                    log.info("Expired previous subscription {} for user {}", existing.getId(), user.getId());
                });

        // Create new subscription
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Subscription.getDurationDays(plan), ChronoUnit.DAYS);

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(plan)
                .status(Subscription.Status.ACTIVE)
                .startsAt(now)
                .expiresAt(expiresAt)
                .autoRenew(false)
                .build();

        subscription = subscriptionRepository.save(subscription);

        // Link payment to subscription
        payment.setSubscription(subscription);
        paymentRepository.save(payment);

        log.info("Activated {} subscription for user {} until {}", plan, user.getId(), expiresAt);
        return subscription;
    }

    /**
     * Cancel a subscription (mark for non-renewal, keep active until expiry).
     */
    @Transactional
    public void cancelSubscription(UUID userId) {
        subscriptionRepository.findActiveByUserId(userId)
                .ifPresent(subscription -> {
                    subscription.setAutoRenew(false);
                    subscription.setStatus(Subscription.Status.CANCELLED);
                    subscriptionRepository.save(subscription);
                    log.info("Cancelled subscription {} for user {}", subscription.getId(), userId);
                });
    }

    /**
     * Get subscription status DTO for API response.
     */
    public SubscriptionStatus getSubscriptionStatus(UUID userId) {
        Optional<Subscription> subOpt = getActiveSubscription(userId);

        if (subOpt.isEmpty()) {
            // Check if they had a subscription before
            var allSubs = subscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (allSubs.isEmpty()) {
                return new SubscriptionStatus(false, "NONE", 0, null, null, true);
            }
            // Had subscription but expired
            Subscription lastSub = allSubs.get(0);
            return new SubscriptionStatus(false, lastSub.getPlan().name(), 0,
                    lastSub.getExpiresAt(), null, false);
        }

        Subscription sub = subOpt.get();
        return new SubscriptionStatus(
                true,
                sub.getPlan().name(),
                sub.getDaysRemaining(),
                sub.getExpiresAt(),
                sub.getStartsAt(),
                sub.getPlan() == Subscription.Plan.TRIAL);
    }

    /**
     * Scheduled job to mark expired subscriptions.
     * Runs every hour.
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void expireSubscriptions() {
        var expired = subscriptionRepository.findExpiredButActive(Instant.now());
        for (Subscription sub : expired) {
            sub.markExpired();
            subscriptionRepository.save(sub);
            log.info("Auto-expired subscription {} for user {}", sub.getId(), sub.getUser().getId());
        }
        if (!expired.isEmpty()) {
            log.info("Expired {} subscriptions", expired.size());
        }
    }

    /**
     * DTO for subscription status response.
     */
    public record SubscriptionStatus(
            boolean active,
            String plan,
            long daysRemaining,
            Instant expiresAt,
            Instant startsAt,
            boolean isTrial) {
    }
}
