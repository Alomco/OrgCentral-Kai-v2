# Gap: Global tenant management (list)

## Legacy reference (old project)
- old/src/app/(app)/admin/global/tenant-management/page.tsx

## New project status (orgcentral)
- No /admin/global/tenant-management route under orgcentral/src/app

## Scope notes
- Platform/global admin surface (not org admin).
- List view only; tenant detail/actions are tracked in `global-tenant-detail-gap.md`.

## Status (as of 2026-02-01)
- ✅ Completed — global tenant list route, filters, and actions are live.

## Impact
- No UI to browse, approve, or archive tenants.

## TODO
- [x] Define tenant list query/filter requirements with explicit allowlists.
- [x] Implement list/search/approve/archive controllers with audit logging and pagination.
- [x] Build tenant list UI with filters, bulk actions, and status chips.
- [x] Add safe defaults (rate limits, export controls, activity logs).
- [x] Add tests for scoping and action permissions.

## Notes
- List page uses break-glass approvals for suspend/archive actions and rate limits on status changes.
