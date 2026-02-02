# Gap: Email verification flow

## Legacy reference (old project)
- old/src/app/(auth)/verify-email/page.tsx

## New project status (orgcentral)
- /verify-email route exists but is currently disabled (`notFound()`).

## Decision (2026-01-31)
- Invite-only access. Verification is handled through admin-led onboarding flows.
- No standalone verification UI is planned.

## Impact
- No first-class email verification or resend UX (by design).

## TODO
- [x] Confirm admin-led verification policy (2026-01-31).
- [ ] Document verification steps in onboarding runbook with audit logging.
- [ ] Ensure admins can resend/verify emails as part of onboarding support.
- [ ] If policy changes, add self-serve verification UI + resend flow.
