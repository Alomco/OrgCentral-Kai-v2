import { invalidateCache } from '@/server/lib/cache-tags';
import {
    HR_ABSENCE_CACHE_SCOPES,
    resolveAbsenceCacheScopes,
} from '@/server/lib/cache-tags/hr-absences';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { CacheScope } from '@/server/repositories/cache-scopes';

export async function invalidateAbsenceScopeCache(
    authorization: RepositoryAuthorizationContext,
    additionalScopes: readonly CacheScope[] = [],
): Promise<void> {
    const scopes = new Set(resolveAbsenceCacheScopes());
    for (const scope of additionalScopes) {
        scopes.add(scope);
    }

    for (const scope of scopes) {
        await invalidateCache({
            orgId: authorization.orgId,
            scope,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });
    }
}

export function buildLeaveBalanceScopes(): CacheScope[] {
    return [HR_ABSENCE_CACHE_SCOPES.leaveBalances];
}

export function buildAiValidationScopes(): CacheScope[] {
    return [HR_ABSENCE_CACHE_SCOPES.aiValidation];
}
