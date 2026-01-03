# Stripe Billing Integration

This document describes how Stripe is integrated for per-user, per-month billing.

## Overview
- Billing is per active membership (seat count) per org.
- Pricing cadence supports monthly or annual plans per employee.
- Stripe checkout is used to start subscriptions.
- Stripe Billing Portal is used for self-service management.
- Webhooks update local subscription state.
- Membership changes trigger seat sync back to Stripe.

## Environment Variables
Required:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

Optional:
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_ANNUAL`
- `STRIPE_PORTAL_RETURN_URL`

## API Endpoints
Org-scoped (requires session + org access):
- `POST /api/org/[orgId]/billing/checkout` -> returns `{ url }`
- `POST /api/org/[orgId]/billing/portal` -> returns `{ url }`
- `GET /api/org/[orgId]/billing/subscription` -> returns `{ subscription }`

Stripe webhook:
- `POST /api/billing/stripe-webhook`
  - Requires `stripe-signature` header.
  - Handles `checkout.session.completed` and `customer.subscription.*`.

## Data Model
- `OrganizationSubscription` lives in `prisma/modules/billing.prisma`.
- Tenant-scoped by `orgId` with residency/classification metadata.

## Webhook Processing
- The webhook handler parses the Stripe event signature and payload.
- Subscription events map into a normalized snapshot and upserted into the repository.
- Events without an `orgId` in Stripe metadata are logged and ignored.

Expected metadata on Stripe subscription/session:
- `orgId`
- `userId`

## Seat Sync
- Active membership count is treated as seat count (minimum 1).
- Seat sync runs on membership updates and invitation acceptance.
- Sync only updates Stripe when a subscription is active/trialing/past due.

## Pricing Cadence
- `billingCadence` selects monthly vs annual pricing for per-employee plans.
- `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_ANNUAL` override the default `STRIPE_PRICE_ID`.

## Local Entry Point
Billing is centralized in:
- `src/server/services/billing/billing-service.ts`
This is the main entry point for checkout, portal, subscription reads, seat sync, and webhook handling.

## Security Notes
- All org endpoints enforce `orgId` scoping via session authorization.
- Webhook uses Stripe signature verification.
