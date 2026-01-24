package com.rewind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionDTO {

    private boolean active;
    private String plan; // TRIAL, MONTHLY, QUARTERLY
    private long daysRemaining;
    private Instant expiresAt;
    private Instant startsAt;
    private boolean isTrial;
    private boolean canUpgrade;
    private int priceMonthly; // 149
    private int priceQuarterly; // 299

    /**
     * Create DTO with pricing info for frontend.
     */
    public static SubscriptionDTO withPricing(
            boolean active, String plan, long daysRemaining,
            Instant expiresAt, Instant startsAt, boolean isTrial) {
        return SubscriptionDTO.builder()
                .active(active)
                .plan(plan)
                .daysRemaining(daysRemaining)
                .expiresAt(expiresAt)
                .startsAt(startsAt)
                .isTrial(isTrial)
                .canUpgrade(!active || isTrial)
                .priceMonthly(149)
                .priceQuarterly(299)
                .build();
    }
}
