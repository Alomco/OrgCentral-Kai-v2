# Gap: Forgot password / reset flow

## Legacy reference (old project)
- old/src/app/(auth)/forgot-password/page.tsx

## New project status (orgcentral)
- /forgot-password route exists but is currently disabled (`notFound()`).
- Login UI routes help requests to support.

## Decision (2026-01-31)
- Invite-only access. Self-serve password reset UI is intentionally disabled.
- Users are directed to support/admins for account recovery.

## Impact
- Users cannot initiate password reset in-app; support workflow is used instead.

## TODO
- [x] Confirm invite-only policy and keep self-serve reset UI disabled (2026-01-31).
- [ ] Document support/admin recovery workflow and SLA in a runbook.
- [ ] Ensure admin-only reset action exists with audit logging and notifications.
- [ ] If policy changes, implement self-serve reset with rate limiting and verification.
