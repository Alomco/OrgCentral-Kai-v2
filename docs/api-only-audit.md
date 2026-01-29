# API-only & React Query Best-Practices Audit

Date: 2026-01-28
Scope: client data flows + mutations + server actions
Goal: API-only access patterns with React Query (typed keys, API modules) and thin route handlers.

## Summary
The codebase shows strong foundations (strict TS, structured layers, React Query provider defaults) and now follows the HRM decision framework: **useActionState for standard forms** and **React Query for interactive/optimistic flows**. API routes remain the boundary for data access, with React Query used for client state and invalidation where applicable.

## Strengths (industry-standard traits)
- Centralized React Query client options: `src/lib/react-query.ts`.
- App-wide provider setup with error boundary: `src/app/providers.tsx`.
- Clear API adapter pattern under `src/server/api-adapters/**`.
- Strong security posture guidance in `AGENTS.md` and `.github/copilot-instructions.md`.

## Gaps to monitor
1. **Direct client `fetch` remains** in a few places; continue moving to API helpers with typed keys.
2. **Server Actions scope** should stay limited to form-heavy flows per the HRM framework.
3. **Invalidation** should always target typed keys; avoid broad invalidations.

## Implementation plan (HRM framework aligned)
### Phase 1: Standard forms
- Keep `useActionState` and ensure React Query invalidation where SSOT is used.
- Ensure actions validate with Zod and use controllers/services.

### Phase 2: Interactive flows
- Use `useMutation` with API helpers for optimistic UI (bulk actions, toggles, uploads).

### Phase 3: Cleanup
- Remove unused client `fetch` calls and centralize API helpers by feature.

## Immediate fixes already applied
- Branding: API module + scoped invalidation (React Query).
- Org profile: API module + typed payload.
- ABAC policies: API module.

## Recommended standards (enforced)
- **API-only**: no `"use server"` actions in app features; use `src/app/api/**/route.ts` only.
- **Client**: React Query with typed keys in `*.api.ts` modules.
- **Invalidation**: `invalidateQueries({ queryKey: ... })` only.
- **Security**: Zod validation in API adapters; tenant checks before data access.

## Proposed tracking
Create a checklist by module with conversions and assign incremental PRs.
