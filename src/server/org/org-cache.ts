import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { CacheScope } from '@/server/repositories/cache-scopes';
import type { OrgContext } from './org-context';

export async function cacheOrgRead<T>(
    org: OrgContext,
    scope: CacheScope,
    loader: () => Promise<T>,
): Promise<T> {
    if (org.classification !== 'OFFICIAL') {
        noStore();
        return loader();
    }

    return cacheOrgReadOfficial(org, scope, loader);
}

async function cacheOrgReadOfficial<T>(
    org: OrgContext,
    scope: CacheScope,
    loader: () => Promise<T>,
): Promise<T> {
    'use cache';
    cacheLife(CACHE_LIFE_SHORT);
    registerOrgCacheTag(org.orgId, scope, org.classification, org.residency);
    return loader();
}
