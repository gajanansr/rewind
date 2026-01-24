package com.rewind.repository;

import com.rewind.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    /**
     * Find payment by Razorpay order ID.
     */
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    /**
     * Find payment by Razorpay payment ID.
     */
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    /**
     * Find all payments for a user.
     */
    List<Payment> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Find successful payments for a user.
     */
    List<Payment> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, Payment.Status status);

    /**
     * Check if user has ever made a successful payment (for trial eligibility).
     */
    boolean existsByUserIdAndStatus(UUID userId, Payment.Status status);
}
