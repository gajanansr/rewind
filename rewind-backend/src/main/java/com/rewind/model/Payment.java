package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @Column(name = "amount_inr", nullable = false)
    private Integer amountInr; // Amount in paise (14900 = ₹149)

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum Status {
        PENDING, // Order created, awaiting payment
        SUCCESS, // Payment verified successfully
        FAILED, // Payment failed or cancelled
        REFUNDED // Payment was refunded
    }

    // Helper methods
    public boolean isSuccess() {
        return status == Status.SUCCESS;
    }

    public boolean isPending() {
        return status == Status.PENDING;
    }

    public void markSuccess(String paymentId, String signature) {
        this.status = Status.SUCCESS;
        this.razorpayPaymentId = paymentId;
        this.razorpaySignature = signature;
    }

    public void markFailed(String reason) {
        this.status = Status.FAILED;
        this.failureReason = reason;
    }

    // Get amount in rupees for display
    public double getAmountInRupees() {
        return amountInr / 100.0;
    }
}
