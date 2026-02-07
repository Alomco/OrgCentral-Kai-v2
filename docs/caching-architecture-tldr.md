# Caching Architecture (TL;DR)

## Rules
- Caching is **use-case owned**.
- UI/components should not manage server cache tags directly.
- Sensitive data must be **no-store** (`classification !== 'OFFICIAL'`).
- Mutations must invalidate server tags and client query keys.

## Runtime model (current)
- Cache engine is hard-locked to Next.js in `src/server/lib/cache-engine/index.ts`.
- Cache tag API SSOT:
  - `src/server/lib/cache-tags.ts`
  - `registerCacheTag(payload)` for read paths
  - `invalidateOrgCache(orgId, scope, classification, residency)` for writes
- Cache scopes SSOT:
  - `src/server/constants/cache-scopes.ts`

## Server restart behavior
- Restart is **cache-cold but correct**:
  - In-memory singletons reset on restart.
  - Next cache data may be cold after restart depending runtime/platform.
  - Requests still resolve from source of truth (DB/services), then repopulate cache.
- Sensitive (`non-OFFICIAL`) reads call `unstable_noStore()` and skip tag registration, so restart cannot serve stale sensitive cache entries.

## React Query coordination
- React Query state is client-side and independent of server process restarts.
- Freshness remains correct because:
  - Mutations invalidate typed query keys (`invalidateQueries`).
  - Server-side writes invalidate Next cache tags (`invalidateOrgCache`).
  - Query defaults in `src/lib/react-query.ts` re-fetch stale data.
- Valid exceptions to `invalidateQueries`:
  - optimistic flows that fully update cache via `setQueryData`
  - one-shot redirect mutations (for example bootstrap flows)

## Do and don't
- Do always pass real tenant context (`orgId`, `classification`, `residency`) into tag helpers.
- Do use module query-key builders and invalidate narrowly.
- Do not use `router.refresh()` as a cache strategy in client flows.
- Do not add Redis/noop cache engines back into runtime.

## Files to know
- `src/server/lib/cache-tags.ts`
- `src/server/lib/cache-engine/index.ts`
- `src/server/lib/cache-engine/backends/next-cache-engine.ts`
- `src/server/constants/cache-scopes.ts`
- `src/lib/react-query.ts`
