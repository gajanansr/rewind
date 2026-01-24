package com.rewind.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.rewind.config.RazorpayConfig;
import com.rewind.model.Payment;
import com.rewind.model.Subscription;
import com.rewind.model.User;
import com.rewind.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;
    private final SubscriptionService subscriptionService;

    /**
     * Create a Razorpay order for a subscription plan.
     */
    @Transactional
    public CreateOrderResponse createOrder(User user, Subscription.Plan plan) throws RazorpayException {
        if (razorpayClient == null) {
            throw new IllegalStateException("Razorpay is not configured");
        }

        if (plan == Subscription.Plan.TRIAL) {
            throw new IllegalArgumentException("Cannot create order for trial plan");
        }

        int amountInPaise = Subscription.getPriceInPaise(plan);

        // Create Razorpay order
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt",
                "rcpt_" + user.getId().toString().substring(0, 8) + "_" + System.currentTimeMillis());
        orderRequest.put("notes", new JSONObject()
                .put("user_id", user.getId().toString())
                .put("plan", plan.name())
                .put("email", user.getEmail()));

        Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        String orderId = razorpayOrder.get("id");

        log.info("Created Razorpay order {} for user {} plan {}", orderId, user.getId(), plan);

        // Save payment record
        Payment payment = Payment.builder()
                .user(user)
                .amountInr(amountInPaise)
                .razorpayOrderId(orderId)
                .status(Payment.Status.PENDING)
                .build();
        paymentRepository.save(payment);

        return new CreateOrderResponse(
                orderId,
                amountInPaise,
                "INR",
                razorpayConfig.getKeyId(),
                user.getEmail(),
                user.getId().toString(),
                plan.name());
    }

    /**
     * Verify payment signature and activate subscription.
     */
    @Transactional
    public VerifyPaymentResponse verifyPayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {

        // Find payment record
        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (paymentOpt.isEmpty()) {
            log.error("Payment not found for order: {}", razorpayOrderId);
            return new VerifyPaymentResponse(false, "Payment not found", null);
        }

        Payment payment = paymentOpt.get();

        // Already processed?
        if (payment.getStatus() == Payment.Status.SUCCESS) {
            log.warn("Payment {} already processed", razorpayOrderId);
            return new VerifyPaymentResponse(true, "Already processed", payment.getSubscription());
        }

        // Verify signature
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayConfig.getKeySecret());

            if (!isValid) {
                log.error("Invalid signature for payment {}", razorpayOrderId);
                payment.markFailed("Invalid signature");
                paymentRepository.save(payment);
                return new VerifyPaymentResponse(false, "Invalid signature", null);
            }
        } catch (RazorpayException e) {
            log.error("Error verifying signature: {}", e.getMessage());
            payment.markFailed("Signature verification error: " + e.getMessage());
            paymentRepository.save(payment);
            return new VerifyPaymentResponse(false, "Verification error", null);
        }

        // Mark payment as success
        payment.markSuccess(razorpayPaymentId, razorpaySignature);
        paymentRepository.save(payment);

        // Determine plan from amount
        Subscription.Plan plan = getPlanFromAmount(payment.getAmountInr());

        // Activate subscription
        Subscription subscription = subscriptionService.activateSubscription(
                payment.getUser(), plan, payment);

        log.info("Payment verified and subscription activated: {} for user {}",
                subscription.getId(), payment.getUser().getId());

        return new VerifyPaymentResponse(true, "Payment successful", subscription);
    }

    /**
     * Handle Razorpay webhook events.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) throws RazorpayException {
        // Use webhook secret if configured, otherwise fallback to key secret
        String secret = razorpayConfig.getWebhookSecret();
        if (secret == null || secret.isEmpty()) {
            secret = razorpayConfig.getKeySecret();
        }

        // Verify webhook signature
        boolean isValid = Utils.verifyWebhookSignature(payload, signature, secret);
        if (!isValid) {
            throw new SecurityException("Invalid webhook signature");
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.getString("event");

        log.info("Received Razorpay webhook: {}", eventType);

        switch (eventType) {
            case "payment.captured" -> handlePaymentCaptured(event);
            case "payment.failed" -> handlePaymentFailed(event);
            case "refund.created" -> handleRefund(event);
            default -> log.debug("Ignoring webhook event: {}", eventType);
        }
    }

    private void handlePaymentCaptured(JSONObject event) {
        JSONObject paymentEntity = event.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");

        String orderId = paymentEntity.getString("order_id");
        String paymentId = paymentEntity.getString("id");

        log.info("Payment captured webhook for order: {}", orderId);

        // Find and update payment if not already processed
        paymentRepository.findByRazorpayOrderId(orderId)
                .filter(p -> p.getStatus() == Payment.Status.PENDING)
                .ifPresent(payment -> {
                    payment.setRazorpayPaymentId(paymentId);
                    payment.setStatus(Payment.Status.SUCCESS);
                    paymentRepository.save(payment);

                    // Activate subscription if not already
                    if (payment.getSubscription() == null) {
                        Subscription.Plan plan = getPlanFromAmount(payment.getAmountInr());
                        subscriptionService.activateSubscription(payment.getUser(), plan, payment);
                    }
                });
    }

    private void handlePaymentFailed(JSONObject event) {
        JSONObject paymentEntity = event.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");

        String orderId = paymentEntity.getString("order_id");
        String reason = paymentEntity.optString("error_description", "Payment failed");

        log.warn("Payment failed webhook for order: {}, reason: {}", orderId, reason);

        paymentRepository.findByRazorpayOrderId(orderId)
                .filter(p -> p.getStatus() == Payment.Status.PENDING)
                .ifPresent(payment -> {
                    payment.markFailed(reason);
                    paymentRepository.save(payment);
                });
    }

    private void handleRefund(JSONObject event) {
        JSONObject refundEntity = event.getJSONObject("payload")
                .getJSONObject("refund").getJSONObject("entity");

        String paymentId = refundEntity.getString("payment_id");

        log.info("Refund webhook for payment: {}", paymentId);

        paymentRepository.findByRazorpayPaymentId(paymentId)
                .ifPresent(payment -> {
                    payment.setStatus(Payment.Status.REFUNDED);
                    paymentRepository.save(payment);

                    // Cancel subscription if exists
                    if (payment.getSubscription() != null) {
                        subscriptionService.cancelSubscription(payment.getUser().getId());
                    }
                });
    }

    private Subscription.Plan getPlanFromAmount(int amountInPaise) {
        if (amountInPaise == Subscription.getPriceInPaise(Subscription.Plan.MONTHLY)) {
            return Subscription.Plan.MONTHLY;
        } else if (amountInPaise == Subscription.getPriceInPaise(Subscription.Plan.QUARTERLY)) {
            return Subscription.Plan.QUARTERLY;
        }
        throw new IllegalArgumentException("Unknown amount: " + amountInPaise);
    }

    // Response DTOs
    public record CreateOrderResponse(
            String orderId,
            int amount,
            String currency,
            String keyId,
            String email,
            String userId,
            String plan) {
    }

    public record VerifyPaymentResponse(
            boolean success,
            String message,
            Subscription subscription) {
    }
}
