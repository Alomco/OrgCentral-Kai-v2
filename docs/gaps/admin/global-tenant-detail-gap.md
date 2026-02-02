# Gap: Global tenant management (detail)

## Legacy reference (old project)
- old/src/app/(app)/admin/global/tenant-management/[tenantId]/page.tsx

## New project status (orgcentral)
- No /admin/global/tenant-management/[tenantId] route under orgcentral/src/app

## Scope notes
- Platform/global admin surface (not org admin).
- Detail view for a single tenant; list view is tracked in `global-tenant-management-gap.md`.

## Status (as of 2026-02-01)
- ✅ Completed — tenant detail route, guarded actions, and audit trail added.

## Impact
- No tenant detail view for status, billing, or audit review.

## TODO
- [x] Define tenant detail data contract (status, plan, usage, billing, security flags).
- [x] Implement tenant detail + actions controllers (suspend, archive, restore) with audit logging.
- [x] Build tenant detail UI with audit history and guarded actions.
- [x] Add permission guardrails and residency/classification checks.
- [x] Add tests for access control and action effects.

## Notes
- Detail view shows billing snapshot and platform audit events scoped to the tenant.
