# Gap: Enterprise admin dashboard

## Legacy reference (old project)
- old/src/app/(app)/admin/enterprise/page.tsx

## New project status (orgcentral)
- No /admin/enterprise route under orgcentral/src/app

## Scope notes
- Platform/enterprise admin surface (multi-org view).
- Should compose global tenant list/detail views rather than duplicating them.

## Status (as of 2026-02-01)
- ✅ Completed — enterprise admin route, metrics, and guardrails implemented in orgcentral.

## Impact
- No multi-org enterprise admin UI or onboarding in the new app.

## TODO
- [x] Define enterprise admin personas, metrics, and org onboarding workflow.
- [x] Implement admin APIs/controllers for org discovery, onboarding state, and metrics with audit logging.
- [x] Build `/admin/enterprise` dashboard UI with onboarding actions and tenant-scoped widgets.
- [x] Add permission guardrails (role allowlists, tenant scoping, rate limits).
- [x] Add tests for access control and onboarding flows.

## Notes
- Enterprise dashboard shipped with tenant metrics, support load, plan counts, and pending impersonations.
