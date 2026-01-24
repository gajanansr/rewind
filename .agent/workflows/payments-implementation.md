---
description: Implementation plan for payments feature with 14-day trial and subscription plans
---

# Payments Feature Implementation Plan

## Overview

Add subscription-based access with 14-day free trial, ₹149/month and ₹299/3-months plans using Razorpay.

## Pricing

| Plan | Price | Duration | Per Month |
|------|-------|----------|-----------|
| Trial | Free | 14 days | - |
| Monthly | ₹149 | 30 days | ₹149 |
| Quarterly | ₹299 | 90 days | ₹100 |

---

## Phase 1: Database & Models (Backend)

### Task 1.1: Create Flyway Migration

File: `V9__add_subscriptions.sql`

```sql
-- Subscription plans enum
CREATE TYPE subscription_plan AS ENUM ('TRIAL', 'MONTHLY', 'QUARTERLY');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan subscription_plan NOT NULL DEFAULT 'TRIAL',
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount_inr INTEGER NOT NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX idx_payments_user ON payments(user_id);
```

### Task 1.2: Create JPA Entities

Files:

- `Subscription.java` - plan, status, dates, user relation
- `Payment.java` - amount, razorpay IDs, status

### Task 1.3: Create Repositories

Files:

- `SubscriptionRepository.java` - findActiveByUserId, findExpiring
- `PaymentRepository.java` - findByUserId, findByRazorpayOrderId

---

## Phase 2: Subscription Service (Backend)

### Task 2.1: SubscriptionService.java

Methods:

- `getActiveSubscription(userId)` - get current active subscription
- `createTrialSubscription(user)` - called on signup, 14 days
- `isSubscriptionActive(userId)` - boolean check
- `getDaysRemaining(userId)` - for UI display
- `activateSubscription(userId, plan, payment)` - after payment success
- `expireSubscription(subscriptionId)` - mark as expired

### Task 2.2: Subscription Check Interceptor

- Create `SubscriptionInterceptor.java`
- Check subscription on protected endpoints
- Return 402 Payment Required if expired
- Exempt certain endpoints (login, subscription status, payment)

---

## Phase 3: Payment Integration (Backend)

### Task 3.1: Razorpay Configuration

- Add to `application.yml`: razorpay.key_id, razorpay.key_secret
- Create `RazorpayConfig.java` bean

### Task 3.2: PaymentService.java

Methods:

- `createOrder(userId, plan)` - creates Razorpay order, returns order_id
- `verifyPayment(orderId, paymentId, signature)` - verify signature
- `handleWebhook(payload)` - process Razorpay webhooks

### Task 3.3: PaymentController.java

Endpoints:

- `POST /api/v1/payments/create-order` - initiate payment
- `POST /api/v1/payments/verify` - verify after frontend callback
- `POST /api/v1/webhooks/razorpay` - webhook handler (public)

---

## Phase 4: User Flow Updates (Backend)

### Task 4.1: Auto-Trial on Signup

- Modify user creation flow
- Call `subscriptionService.createTrialSubscription(user)` after registration

### Task 4.2: Subscription Status Endpoint

- `GET /api/v1/subscription` - returns plan, status, daysRemaining, expiresAt

---

## Phase 5: Frontend - Subscription Check

### Task 5.1: Subscription Store (Zustand)

File: `subscriptionStore.ts`

- Store subscription status
- Fetch on app load
- Provide `isActive`, `daysRemaining`, `plan`

### Task 5.2: ProtectedRoute Enhancement

- Check subscription status
- Redirect to pricing if expired
- Show trial banner if < 3 days remaining

### Task 5.3: API Client Update

- Handle 402 status code → redirect to pricing
- Add subscription and payment endpoints

---

## Phase 6: Frontend - UI Components

### Task 6.1: TrialBanner Component

- Shows "X days left in trial" or "Trial expired"
- Upgrade CTA button
- Appears on Dashboard/Questions pages

### Task 6.2: Pricing Page

File: `Pricing.tsx`

- Display 3 plan cards (Trial info, Monthly, Quarterly)
- Highlight savings on quarterly
- "Current Plan" badge for active plan
- Razorpay checkout button

### Task 6.3: Checkout Flow

- Integrate Razorpay checkout.js
- Handle success/failure callbacks
- Show confirmation modal

### Task 6.4: Settings - Subscription Section

- Current plan details
- Expiry date
- Upgrade/Cancel options

---

## Phase 7: Testing & Polish

### Task 7.1: Test Scenarios

- New user signup → gets trial
- Trial expiry → blocked from protected pages
- Payment success → subscription activated
- Payment failure → stays on old plan
- Webhook handling

### Task 7.2: Edge Cases

- User tries to pay while trial active
- Overlapping subscriptions
- Timezone handling for expiry

---

## Execution Order

```
Phase 1 (Database) ──▶ Phase 2 (Service) ──▶ Phase 3 (Razorpay) ──▶ Phase 4 (User Flow)
                                                                          │
                                                                          ▼
                    Phase 7 (Testing) ◀── Phase 6 (UI) ◀── Phase 5 (Frontend Logic)
```

## Environment Variables Needed

### Backend (application.yml)

```yaml
razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}
```

### Frontend (.env)

```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Quick Commands

// turbo-all

1. Start Phase 1: Create migration file
2. Create Subscription entity
3. Create Payment entity
4. Create repositories
5. Create SubscriptionService
6. Create PaymentService
7. Create controllers
8. Frontend subscription store
9. Pricing page UI
10. Razorpay integration
