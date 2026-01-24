package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Plan plan = Plan.TRIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "starts_at", nullable = false)
    @Builder.Default
    private Instant startsAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "auto_renew")
    @Builder.Default
    private Boolean autoRenew = false;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum Plan {
        TRIAL, // 14 days free
        MONTHLY, // ₹149/month
        QUARTERLY // ₹299/3 months
    }

    public enum Status {
        ACTIVE,
        EXPIRED,
        CANCELLED
    }

    // Helper methods
    public boolean isActive() {
        return status == Status.ACTIVE && Instant.now().isBefore(expiresAt);
    }

    public boolean isExpired() {
        return status == Status.EXPIRED || Instant.now().isAfter(expiresAt);
    }

    public long getDaysRemaining() {
        if (isExpired())
            return 0;
        long seconds = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, seconds / (24 * 60 * 60));
    }

    public void markExpired() {
        this.status = Status.EXPIRED;
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Plan pricing in paise (for Razorpay)
    public static int getPriceInPaise(Plan plan) {
        return switch (plan) {
            case TRIAL -> 0;
            case MONTHLY -> 14900; // ₹149
            case QUARTERLY -> 29900; // ₹299
        };
    }

    // Plan duration in days
    public static int getDurationDays(Plan plan) {
        return switch (plan) {
            case TRIAL -> 14;
            case MONTHLY -> 30;
            case QUARTERLY -> 90;
        };
    }
}
