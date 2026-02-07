# API-only and React Query Best-Practices Audit

Date: 2026-02-07
Scope: client data flows, mutations, server actions, cache invalidation paths
Goal: API-only access patterns with React Query (typed keys, API modules) and thin route handlers.

## Summary
The codebase is aligned with the HRM framework:
- `useActionState` for form-heavy submissions.
- React Query for interactive client-side server state.
- API adapters/controllers remain the primary data boundary.

## What is working
- Centralized React Query client options in `src/lib/react-query.ts`.
- App-wide provider setup in `src/app/providers.tsx`.
- Mutation invalidation is broadly scoped to typed query keys.
- `router.refresh()` is not used in client flows.

## Restart and cache coherence check
- Server cache is Next.js-backed and can be cold after restart.
- Correctness is preserved because reads fall back to source-of-truth data paths.
- Sensitive data is forced to `noStore`, so no sensitive cache replay across restarts.
- React Query remains coherent because key-scoped invalidation is used after mutations.

## Mutation invalidation notes
- Most `useMutation` call-sites invalidate query keys.
- Legitimate exceptions observed:
  - bootstrap redirect flow (`src/components/auth/AdminBootstrapComplete.tsx`)
  - optimistic notification preference updates using `setQueryData` (`src/app/(app)/hr/notifications/settings/notification-settings-form.tsx`)

## Gaps to keep monitoring
1. Keep replacing any remaining direct client `fetch` usage with typed API modules.
2. Keep invalidations narrow and typed; avoid broad key prefixes.
3. Keep server-tag invalidation (`invalidateOrgCache`) paired with client-key invalidation for hybrid pages.

## Recommended standards (enforced)
- API-only boundaries via route handlers/controllers.
- React Query with typed query keys in feature modules.
- Query invalidation via `invalidateQueries({ queryKey })`.
- Zod validation plus org/residency/classification checks at boundaries.
