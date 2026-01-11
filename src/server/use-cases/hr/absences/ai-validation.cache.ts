import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateAbsenceScopeCache, buildAiValidationScopes } from '@/server/use-cases/hr/absences/cache-helpers';

export async function invalidateAbsenceAiCaches(authorization: RepositoryAuthorizationContext): Promise<void> {
    const tag = buildAbsenceCacheTag(authorization);
    await Promise.all([
        invalidateAbsenceScopeCache(authorization, buildAiValidationScopes()),
        revalidateCustomTag(tag),
    ]);
}

export function buildAbsenceCacheTag(authorization: RepositoryAuthorizationContext): string {
    return ['org', authorization.orgId, 'hr-absences', authorization.dataResidency, authorization.dataClassification].join(':');
}

async function revalidateCustomTag(tag: string): Promise<void> {
    try {
        const cache = await import('next/cache');
        const revalidateTag = cache.revalidateTag;
        if (typeof revalidateTag === 'function') {
            revalidateTag(tag, 'seconds');
        }
    } catch {
        // best-effort cache invalidation
    }
}
