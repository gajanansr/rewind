package com.rewind.controller;

import com.razorpay.RazorpayException;
import com.rewind.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final PaymentService paymentService;

    /**
     * Razorpay webhook endpoint.
     * This endpoint should be public (no auth required).
     */
    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Received Razorpay webhook");

        try {
            paymentService.handleWebhook(payload, signature);
            return ResponseEntity.ok("Webhook processed");
        } catch (SecurityException e) {
            log.error("Webhook signature verification failed");
            return ResponseEntity.status(401).body("Invalid signature");
        } catch (RazorpayException e) {
            log.error("Error processing webhook: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Processing error");
        } catch (Exception e) {
            log.error("Unexpected webhook error: {}", e.getMessage(), e);
            // Return 200 anyway to prevent Razorpay from retrying
            return ResponseEntity.ok("Error logged");
        }
    }
}
