# Gap: Global user impersonation

## Legacy reference (old project)
- old/src/app/(app)/admin/global/page.tsx (User Impersonation card)

## New project status (orgcentral)
- No impersonation UI or guardrail flow under orgcentral/src/app

## Scope notes
- Platform/global support tool (not org admin).
- Requires audited, time-boxed access with approvals and MFA checks.

## Status (as of 2026-02-01)
- ✅ Completed — impersonation request/approval/session flows implemented.

## Impact
- Support teams cannot troubleshoot user sessions safely.

## TODO
- [x] Define impersonation policy (roles, approvals, duration, logging).
- [x] Implement impersonation session issuance with time-boxed tokens and audit logging.
- [x] Build impersonation UI with reason capture, approvals, and stop controls.
- [x] Add guardrails (MFA checks, IP allowlists, break-glass alerts).
- [x] Add tests for access control and revocation.

## Notes
- Requests require break-glass approval and MFA, with time-boxed session tokens.
