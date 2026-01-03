# Subscription Billing Enhancement Plan

> **Objective:** Enable org admins to enter payment details (card or direct debit) and implement automatic monthly billing based on user count.

---

## 1. Executive Summary

This document outlines the required changes to transition from on-demand checkout to a fully automated subscription billing model where:

1. **Org admins** can enter and manage payment methods (card or Direct Debit/BACS)
2. **Billing is automatic** at the end of each billing cycle
3. **Pricing is usage-based** on the number of active users per month

---

## 2. Current State Analysis

### 2.1 Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Stripe Integration | ✅ Implemented | `src/server/services/billing/` |
| Subscription Model | ✅ Per-seat model | `OrganizationSubscription` table |
| Checkout Flow | ✅ Stripe Checkout | `billing-service.ts → createCheckoutSession()` |
| Portal Access | ✅ Stripe Portal | `billing-service.ts → createPortalSession()` |
| Seat Sync | ✅ Auto-sync on membership changes | `billing-service.ts → syncSeats()` |
| Webhook Handler | ✅ Subscription lifecycle events | `stripe-billing-gateway.ts` |
| Billing Settings | ✅ Cadence (monthly/annual) + email | `org-settings-model.ts` |

### 2.2 Current Data Model

```prisma
model OrganizationSubscription {
  id                       String  @id @default(uuid())
  orgId                    String  @db.Uuid
  stripeCustomerId         String  // Links to Stripe Customer
  stripeSubscriptionId     String  // Links to Stripe Subscription
  stripeSubscriptionItemId String? // Line item for seat-based pricing
  stripePriceId            String  // Current price plan
  status                   BillingSubscriptionStatus
  seatCount                Int     @default(1)
  currentPeriodEnd         DateTime?
  cancelAtPeriodEnd        Boolean @default(false)
  // ... tenant metadata
}
```

### 2.3 Current Flow

1. Admin clicks "Subscribe" → Stripe Checkout (hosted page)
2. User enters card → Stripe handles payment
3. Webhook receives `checkout.session.completed` + `customer.subscription.created`
4. Subscription stored locally with seat count
5. Membership changes trigger `syncSeats()` → Stripe quantity update

---

## 3. Required Changes

### 3.1 Payment Method Management

#### 3.1.1 Stripe Setup Intent Flow (New)

Enable org admins to add/update payment methods without immediate checkout:

**API Requirements:**
- `POST /api/org/[orgId]/billing/setup-intent` — Create Stripe SetupIntent
- `GET /api/org/[orgId]/billing/payment-methods` — List saved payment methods
- `DELETE /api/org/[orgId]/billing/payment-methods/[pmId]` — Remove payment method
- `POST /api/org/[orgId]/billing/payment-methods/[pmId]/default` — Set default

**Gateway Interface Extension:**
```typescript
// billing-gateway.ts additions
interface BillingGateway {
  // Existing...
  
  // New methods
  createSetupIntent(input: {
    customerId: string;
    paymentMethodTypes: ('card' | 'bacs_debit')[];
  }): Promise<{ clientSecret: string }>;
  
  listPaymentMethods(customerId: string): Promise<PaymentMethodSummary[]>;
  
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  
  setDefaultPaymentMethod(input: {
    customerId: string;
    paymentMethodId: string;
  }): Promise<void>;
}
```

#### 3.1.2 UK Direct Debit (BACS) Support

For UK compliance, enable BACS Direct Debit alongside card payments:

**Stripe Configuration Required:**
- Enable BACS Direct Debit in Stripe Dashboard
- Configure mandate collection settings
- Set up BACS-specific webhook events

**Payment Method Types:**
| Type | Collection Time | Best For |
|------|-----------------|----------|
| Card | Instant | Immediate activation |
| BACS Direct Debit | 3-4 business days | UK businesses, recurring |

### 3.2 Automatic End-of-Cycle Billing

#### 3.2.1 Stripe Subscription Billing Mode

The current implementation uses **quantity-based subscriptions** which already support automatic billing:

```typescript
// Current: Stripe auto-bills at `current_period_end`
// No code changes needed for basic auto-renewal
```

**Configuration Verification:**
- Stripe subscription `collection_method: 'charge_automatically'` (default)
- `billing_cycle_anchor` set appropriately
- `proration_behavior` configured for seat changes

#### 3.2.2 User Count Calculation

**Current Implementation (Already Correct):**
```typescript
// billing-service.ts
private async resolveSeatCount(auth): Promise<number> {
  const count = await this.membershipRepository.countActiveMemberships(auth);
  return Math.max(count, 1);
}
```

**Enhancement Needed:**
Track historical user counts for billing transparency:

```prisma
// New model for billing history
model BillingSnapshot {
  id              String   @id @default(uuid())
  orgId           String   @db.Uuid
  snapshotDate    DateTime
  activeUserCount Int
  pricePerUser    Decimal  @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)
  currency        String   @default("gbp")
  invoiceId       String?  // Stripe Invoice ID
  createdAt       DateTime @default(now())
  
  org Organization @relation(fields: [orgId], references: [id])
  
  @@index([orgId, snapshotDate])
  @@schema("hr")
}
```

### 3.3 Invoice Handling

#### 3.3.1 Stripe Invoice Webhooks

**New Webhook Events to Handle:**
- `invoice.created` — Preview upcoming charge
- `invoice.finalized` — Invoice locked, ready for payment
- `invoice.paid` — Payment successful
- `invoice.payment_failed` — Payment failed, retry scheduled
- `invoice.upcoming` — Warning before next billing cycle

**Gateway Extension:**
```typescript
// Additional webhook event types
export type BillingWebhookEvent =
  | { type: 'subscription.created'; ... }
  | { type: 'subscription.updated'; ... }
  | { type: 'invoice.created'; invoice: InvoiceSnapshot }
  | { type: 'invoice.paid'; invoice: InvoiceSnapshot }
  | { type: 'invoice.payment_failed'; invoice: InvoiceSnapshot; failureReason: string }
  | ...;
```

#### 3.3.2 Failed Payment Handling

**Dunning Configuration (Stripe Dashboard):**
- Retry schedule: 1 day, 3 days, 5 days after failure
- Send email notifications on failure
- Mark subscription `past_due` after all retries fail

**Application-Level Response:**
```typescript
// On invoice.payment_failed:
// 1. Update subscription status to PAST_DUE
// 2. Send admin notification via existing notification system
// 3. Show banner in org dashboard

// On consecutive failures (subscription canceled):
// 1. Update status to CANCELED
// 2. Trigger grace period logic (if applicable)
// 3. Restrict org access based on policy
```

---

## 4. UI/UX Changes

### 4.1 Billing Settings Page Enhancement

**Current UI:** `src/app/(app)/org/settings/_components/billing-settings-form.tsx`

**New Sections Required:**

```
┌─────────────────────────────────────────────────────────┐
│ Billing Settings                                        │
├─────────────────────────────────────────────────────────┤
│ SUBSCRIPTION STATUS                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Status: Active          Next billing: 1 Feb 2026   │ │
│ │ Users: 25               Est. charge: £250.00       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ PAYMENT METHODS                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💳 Visa •••• 4242      Expires 12/27    [Default]  │ │
│ │ 🏦 BACS •••• 1234      Barclays         [Remove]   │ │
│ │                                                     │ │
│ │ [+ Add payment method]                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ BILLING PREFERENCES                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Billing email: [billing@company.com]               │ │
│ │ Billing cadence: [Monthly ▼]                        │ │
│ │ Auto-renew: [✓]                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ BILLING HISTORY                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Jan 2026  │ 25 users │ £250.00 │ Paid │ [Invoice]  │ │
│ │ Dec 2025  │ 22 users │ £220.00 │ Paid │ [Invoice]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Manage in Stripe Portal →]                             │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Payment Method Collection Modal

Use **Stripe Elements** for PCI-compliant payment collection:

```tsx
// New component: PaymentMethodForm.tsx
// Uses @stripe/react-stripe-js

<PaymentElement 
  options={{
    paymentMethodTypes: ['card', 'bacs_debit'],
    layout: 'tabs',
  }}
/>
```

### 4.3 Billing Alerts

**Dashboard Banner Conditions:**
- `status === 'PAST_DUE'` → "Payment failed. Update your payment method."
- `currentPeriodEnd` approaching → "Your subscription renews on {date}."
- No payment method → "Add a payment method to avoid service interruption."

---

## 5. Data Model Changes

### 5.1 New Prisma Models

```prisma
// prisma/modules/billing.prisma additions

model PaymentMethod {
  id                String   @id @default(uuid()) @db.Uuid
  orgId             String   @db.Uuid
  stripePaymentMethodId String @unique
  type              PaymentMethodType
  last4             String
  brand             String?  // For cards: visa, mastercard, etc.
  bankName          String?  // For BACS
  expiryMonth       Int?     // For cards
  expiryYear        Int?     // For cards
  isDefault         Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
  @@schema("hr")
}

enum PaymentMethodType {
  CARD
  BACS_DEBIT
  SEPA_DEBIT
  @@schema("hr")
}

model BillingInvoice {
  id                String        @id @default(uuid()) @db.Uuid
  orgId             String        @db.Uuid
  stripeInvoiceId   String        @unique
  status            InvoiceStatus
  amountDue         Int           // In smallest currency unit (pence)
  amountPaid        Int
  currency          String        @default("gbp")
  periodStart       DateTime
  periodEnd         DateTime
  userCount         Int
  invoiceUrl        String?
  invoicePdf        String?
  paidAt            DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, periodStart])
  @@schema("hr")
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
  @@schema("hr")
}
```

### 5.2 Org Settings Extension

```typescript
// org-settings-model.ts extension
export const billingSettingsSchema = z.object({
  billingEmail: z.string(),
  billingCadence: z.enum(['monthly', 'annual']),
  autoRenew: z.boolean(),
  // New fields
  invoicePrefix: z.string().optional(), // e.g., "ACME-" for invoice numbers
  vatNumber: z.string().optional(),     // For UK VAT compliance
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().default('GB'),
  }).optional(),
});
```

---

## 6. API Endpoints Summary

### 6.1 New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/org/[orgId]/billing/setup-intent` | Create SetupIntent for adding payment method |
| `GET` | `/api/org/[orgId]/billing/payment-methods` | List org's payment methods |
| `DELETE` | `/api/org/[orgId]/billing/payment-methods/[pmId]` | Remove a payment method |
| `POST` | `/api/org/[orgId]/billing/payment-methods/[pmId]/default` | Set default payment method |
| `GET` | `/api/org/[orgId]/billing/invoices` | List billing history |
| `GET` | `/api/org/[orgId]/billing/invoices/[invoiceId]` | Get invoice details |
| `GET` | `/api/org/[orgId]/billing/upcoming` | Preview next invoice |

### 6.2 Existing Endpoints (No Change)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/org/[orgId]/billing/checkout` | Create checkout session |
| `POST` | `/api/org/[orgId]/billing/portal` | Create portal session |
| `GET` | `/api/org/[orgId]/billing/subscription` | Get subscription status |
| `POST` | `/api/billing/stripe-webhook` | Handle Stripe webhooks |

---

## 7. Environment Variables

### 7.1 Existing (No Change)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
STRIPE_SUCCESS_URL=https://app.example.com/org/settings?billing=success
STRIPE_CANCEL_URL=https://app.example.com/org/settings?billing=cancelled
STRIPE_PORTAL_RETURN_URL=https://app.example.com/org/settings
```

### 7.2 New (Optional)

```env
# Enable BACS Direct Debit (requires Stripe activation)
STRIPE_ENABLE_BACS_DEBIT=true

# Grace period (days) after subscription cancellation
BILLING_GRACE_PERIOD_DAYS=7

# Publishable key for Stripe Elements (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 8. Security Considerations

### 8.1 PCI Compliance

- **DO NOT** store raw card numbers in the database
- Use Stripe Elements or Checkout for all payment collection
- Payment method tokens (`pm_xxx`) are safe to store
- All payment data flows through Stripe's PCI-compliant infrastructure

### 8.2 Authorization

- All billing endpoints require `organization: ['update']` permission
- Payment method operations scoped to org admins only
- Webhook endpoint validates Stripe signature (existing)

### 8.3 Audit Logging

- Log all payment method additions/removals
- Log subscription state changes
- Log failed payment attempts (without sensitive details)

---

## 9. Implementation Phases

### Phase 1: Payment Method Management (Priority: High)
- [ ] Extend `BillingGateway` with SetupIntent methods
- [ ] Add `PaymentMethod` model and repository
- [ ] Create payment method API endpoints
- [ ] Build payment method UI with Stripe Elements
- [ ] Add payment method listing to billing settings

### Phase 2: Invoice History (Priority: Medium)
- [ ] Add `BillingInvoice` model and repository
- [ ] Handle invoice webhooks (`invoice.paid`, etc.)
- [ ] Create invoice listing endpoint
- [ ] Add invoice history UI section

### Phase 3: BACS Direct Debit (Priority: Medium)
- [ ] Enable BACS in Stripe Dashboard
- [ ] Update SetupIntent to include `bacs_debit`
- [ ] Handle BACS-specific mandate webhooks
- [ ] Update UI to show bank account details

### Phase 4: Billing Alerts & Grace Period (Priority: Low)
- [ ] Implement dashboard banner component
- [ ] Add grace period logic for failed payments
- [ ] Send notification on payment failure
- [ ] Implement access restriction after grace period

---

## 10. Testing Checklist

### 10.1 Stripe Test Mode

- [ ] Add card via SetupIntent flow
- [ ] Add BACS account via SetupIntent flow
- [ ] Verify subscription creates with saved payment method
- [ ] Simulate `4000000000000341` (decline after attach) for failure testing
- [ ] Test webhook event handling for all invoice states

### 10.2 End-to-End Scenarios

- [ ] New org → Add payment → Subscribe → Auto-bill next month
- [ ] Existing subscriber → Add second payment method → Set as default
- [ ] Payment failure → Retry → Update payment method → Successful rebill
- [ ] Change user count → Verify prorated billing
- [ ] Cancel subscription → Verify access through `currentPeriodEnd`

---

## 11. Stripe Dashboard Configuration

### 11.1 Required Settings

1. **Products & Prices**
   - Create per-seat price with `billing_scheme: per_unit`
   - Set `recurring.usage_type: licensed` (not metered)

2. **Customer Portal**
   - Enable payment method management
   - Enable invoice history
   - Configure subscription cancellation policy

3. **Webhooks**
   - Add `invoice.*` events to existing webhook
   - Add `setup_intent.succeeded` event
   - Add `payment_method.attached`/`detached` events

4. **BACS Direct Debit (if enabled)**
   - Complete Stripe BACS onboarding
   - Configure mandate notification emails

---

## 12. Pricing Model Summary

| Metric | Value |
|--------|-------|
| Billing Unit | Per active user per month |
| Minimum Charge | 1 user (even if org has 0 active users) |
| User Count Source | `membershipRepository.countActiveMemberships()` |
| Sync Trigger | Membership create/update/delete |
| Proration | `create_prorations` (charge immediately for mid-cycle additions) |
| Billing Cycle | Monthly or Annual (org setting) |
| Collection | Automatic at period end |

---

## 13. References

- **Current Integration:** [stripe.md](./stripe.md)
- **Billing Service:** `src/server/services/billing/billing-service.ts`
- **Stripe Gateway:** `src/server/services/billing/stripe-billing-gateway.ts`
- **Subscription Model:** `prisma/modules/billing.prisma`
- **Stripe Docs:** https://stripe.com/docs/billing/subscriptions/overview
- **Stripe BACS:** https://stripe.com/docs/payments/bacs-debit

---

*Last Updated: January 2026*
