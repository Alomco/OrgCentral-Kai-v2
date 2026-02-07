# Cache Profiles and Tags

## Cache profiles
- `CACHE_LIFE_BRIEF`: `'seconds'` for short-lived fallback caching.
- `CACHE_LIFE_SHORT`: `'minutes'` for frequently changing read data.
- `CACHE_LIFE_LONG`: `'hours'` for stable settings and templates.

Profiles live in `src/server/repositories/cache-profiles.ts`.

## Usage pattern (server)
1. Call `cacheLife` with a profile constant.
2. For non-`OFFICIAL` data, call `unstable_noStore()`.
3. Register org-scoped tags through `registerCacheTag`/`registerOrgCacheTag`.
4. After successful writes, call `invalidateOrgCache` with tenant context.

Example:

```ts
import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';

if (authorization.dataClassification !== 'OFFICIAL') {
  noStore();
  return loadData();
}

cacheLife(CACHE_LIFE_SHORT);
registerOrgCacheTag(orgId, scope, authorization.dataClassification, authorization.dataResidency);
return loadData();
```

## React Query bridge (client)
- Use typed query keys in feature API/query modules.
- On mutation success, invalidate only affected keys.
- Prefer optimistic updates + rollback where latency matters.
- Do not rely on `router.refresh()` for client cache coherence.

## Restart expectations
- Server restart may clear warm cache state.
- Behavior remains correct: first request repopulates server cache from source of truth.
- React Query keeps client state until reload, then revalidates using query settings.

## Cache scope registry
- Canonical registry: `src/server/constants/cache-scopes.ts`.
- Re-export for repository consumers: `src/server/repositories/cache-scopes.ts`.

When adding a new domain, define one scope in the registry and reuse that constant for both tag registration and invalidation.
