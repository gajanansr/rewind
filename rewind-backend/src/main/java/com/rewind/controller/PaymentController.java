package com.rewind.controller;

import com.razorpay.RazorpayException;
import com.rewind.model.Subscription;
import com.rewind.model.User;
import com.rewind.service.PaymentService;
import com.rewind.service.PaymentService.CreateOrderResponse;
import com.rewind.service.PaymentService.VerifyPaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

        private final PaymentService paymentService;

        /**
         * Create a Razorpay order for checkout.
         */
        @PostMapping("/create-order")
        public ResponseEntity<?> createOrder(
                        @AuthenticationPrincipal User user,
                        @RequestBody CreateOrderRequest request) {
                try {
                        Subscription.Plan plan = Subscription.Plan.valueOf(request.plan().toUpperCase());
                        CreateOrderResponse response = paymentService.createOrder(user, plan);
                        return ResponseEntity.ok(response);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid plan: " + request.plan()));
                } catch (RazorpayException e) {
                        log.error("Razorpay error creating order: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(Map.of("error", "Payment service error. Please try again."));
                } catch (IllegalStateException e) {
                        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                                        .body(Map.of("error", "Payment service not configured"));
                }
        }

        /**
         * Verify payment after Razorpay checkout callback.
         */
        @PostMapping("/verify")
        public ResponseEntity<?> verifyPayment(
                        @AuthenticationPrincipal User user,
                        @RequestBody VerifyPaymentRequest request) {

                VerifyPaymentResponse response = paymentService.verifyPayment(
                                request.razorpayOrderId(),
                                request.razorpayPaymentId(),
                                request.razorpaySignature());

                if (response.success()) {
                        return ResponseEntity.ok(Map.of(
                                        "success", true,
                                        "message", response.message(),
                                        "subscription", Map.of(
                                                        "plan", response.subscription().getPlan().name(),
                                                        "expiresAt", response.subscription().getExpiresAt(),
                                                        "daysRemaining", response.subscription().getDaysRemaining())));
                } else {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "success", false,
                                        "error", response.message()));
                }
        }

        /**
         * Get available plans with pricing.
         */
        @GetMapping("/plans")
        public ResponseEntity<?> getPlans() {
                var monthlyPlan = Map.of(
                        "id", "MONTHLY",
                        "name", "Monthly",
                        "price", 149,
                        "currency", "INR",
                        "duration", "30 days",
                        "description", "Full access for 1 month");

                var quarterlyPlan = Map.of(
                        "id", "QUARTERLY",
                        "name", "Quarterly",
                        "price", 299,
                        "currency", "INR",
                        "duration", "90 days",
                        "description", "Full access for 3 months",
                        "savings", "Save ₹148",
                        "popular", true);

                return ResponseEntity.ok(Map.of("plans", java.util.List.of(monthlyPlan, quarterlyPlan)));
        }

        // Request/Response records
        public record CreateOrderRequest(String plan) {
        }

        public record VerifyPaymentRequest(
                        String razorpayOrderId,
                        String razorpayPaymentId,
                        String razorpaySignature) {
        }
}
