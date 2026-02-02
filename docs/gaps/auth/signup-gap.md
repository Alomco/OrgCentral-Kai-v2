# Gap: User signup (self-serve)

## Legacy reference (old project)
- old/src/app/(auth)/signup/page.tsx
- old/src/app/(auth)/signup/SignupClient.tsx

## New project status (orgcentral)
- /signup route exists but is currently disabled (`notFound()`).
- Only admin bootstrap exists at orgcentral/src/app/(auth)/admin-signup

## Decision (2026-01-31)
- Invite-only access. Self-serve signup is intentionally disabled.
- Access requests are routed to support and org admins.

## Impact
- End users cannot create accounts without an admin bootstrap path (by design).

## TODO
- [x] Confirm invite-only policy and keep self-serve signup disabled (2026-01-31).
- [ ] Document access request + admin approval workflow (runbook + notifications).
- [ ] Ensure admin bootstrap flow covers org provisioning with audit logging.
- [ ] If policy changes, implement self-serve signup with verification + abuse protection.
