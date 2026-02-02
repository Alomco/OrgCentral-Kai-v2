# Gap: Global support tickets console

## Legacy reference (old project)
- old/src/app/(app)/admin/global/page.tsx (Support Tickets card)

## New project status (orgcentral)
- No support ticket console under orgcentral/src/app

## Scope notes
- Platform/global support console with tenant context.
- Should integrate with notifications/inbox for updates, but not replace user-facing inbox.

## Status (as of 2026-02-01)
- ✅ Completed — support ticket console, APIs, and workflow updates added.

## Impact
- No centralized support ticket intake or triage UI.

## TODO
- [x] Define support ticket schema (tenant, requester, severity, SLA, status).
- [x] Implement ticket intake/triage controllers with audit logging and org context.
- [x] Build support console UI with filters, assignment, and status workflows.
- [x] Add notifications for updates and SLA breaches.
- [x] Add tests for data access and workflow transitions.

## Notes
- Support tickets are stored with tenant context and audited on create/update.
