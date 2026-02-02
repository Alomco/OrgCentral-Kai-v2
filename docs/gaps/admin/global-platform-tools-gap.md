# Gap: Global platform tools

## Legacy reference (old project)
- old/src/app/(app)/admin/global/platform-tools/page.tsx

## New project status (orgcentral)
- No /admin/global/platform-tools route; only dev tools under orgcentral/src/app/(dev)

## Scope notes
- Platform/global admin surface (not org admin).
- Dev tools are not a substitute; this must be guarded and audited.

## Status (as of 2026-02-01)
- ✅ Completed — guarded platform tools surface and execution history added.

## Impact
- No admin UI for maintenance tools (backfills, claim sync, scheduled tasks).

## TODO
- [x] Define platform tool allowlist with required parameters and runbook links.
- [x] Implement secure execution controllers with Zod validation, confirmations, and audit logs.
- [x] Build tooling UI with dry-run, status, and execution history.
- [x] Add guardrails (rate limits, role allowlists, break-glass approvals).
- [x] Add tests and monitoring for tool execution outcomes.

## Notes
- Tool executions are rate-limited, MFA-gated, and audited.
