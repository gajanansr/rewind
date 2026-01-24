package com.rewind.repository;

import com.rewind.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    /**
     * Find the active subscription for a user.
     */
    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' ORDER BY s.createdAt DESC")
    Optional<Subscription> findActiveByUserId(UUID userId);

    /**
     * Find all subscriptions for a user.
     */
    List<Subscription> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Check if user has any active subscription.
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Subscription s " +
            "WHERE s.user.id = :userId AND s.status = 'ACTIVE' AND s.expiresAt > :now")
    boolean hasActiveSubscription(UUID userId, Instant now);

    /**
     * Find subscriptions expiring within a given timeframe (for reminder emails).
     */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt BETWEEN :start AND :end")
    List<Subscription> findExpiringBetween(Instant start, Instant end);

    /**
     * Find expired subscriptions that need to be marked as expired.
     */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt < :now")
    List<Subscription> findExpiredButActive(Instant now);
}
