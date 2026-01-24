package com.rewind.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class RazorpayConfig {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        if (keyId.isEmpty() || keySecret.isEmpty()) {
            log.warn("Razorpay credentials not configured. Payment features will be disabled.");
            return null;
        }
        log.info("Razorpay client initialized with key: {}...", keyId.substring(0, Math.min(10, keyId.length())));
        return new RazorpayClient(keyId, keySecret);
    }

    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }
}
