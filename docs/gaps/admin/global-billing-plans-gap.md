# Gap: Global billing plan management

## Legacy reference (old project)
- old/src/app/(app)/admin/global/billing/plans/page.tsx

## New project status (orgcentral)
- No /admin/global/billing/plans route under orgcentral/src/app

## Scope notes
- Platform/global admin surface (not org admin).
- Use Stripe-backed plan catalog; align with `docs/subscription-billing-enhancement.md`.

## Status (as of 2026-02-01)
- ✅ Completed — billing plan catalog and assignment flows implemented.

## Impact
- No UI to manage subscription plans at platform level.

## TODO
- [x] Define billing plan model (features, limits, pricing) and data lifecycle.
- [x] Implement plan CRUD + tenant assignment controllers with Zod validation and audit logging.
- [x] Build plan management UI (create/edit/assign) with status visibility.
- [x] Sync changes with billing provider (Stripe) and handle effective dates/proration.
- [x] Add tests for permissions, assignments, and provider sync.

## Notes
- Assignment uses Stripe subscription updates with proration behavior inputs and platform audit logging.
