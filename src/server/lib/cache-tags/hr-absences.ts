import {
    CACHE_SCOPE_ABSENCES,
    CACHE_SCOPE_HR_ABSENCE_AI_VALIDATION,
    CACHE_SCOPE_LEAVE_BALANCES,
    type CacheScope,
} from '@/server/constants/cache-scopes';

export const HR_ABSENCE_CACHE_SCOPES = {
    absences: CACHE_SCOPE_ABSENCES,
    leaveBalances: CACHE_SCOPE_LEAVE_BALANCES,
    aiValidation: CACHE_SCOPE_HR_ABSENCE_AI_VALIDATION,
} as const;

export type HrAbsenceCacheScopeKey = keyof typeof HR_ABSENCE_CACHE_SCOPES;

export function resolveAbsenceCacheScopes(options?: {
    includeLeaveBalances?: boolean;
    includeAiValidation?: boolean;
}): CacheScope[] {
    const scopes = new Set<CacheScope>();
    scopes.add(HR_ABSENCE_CACHE_SCOPES.absences);

    if (options?.includeLeaveBalances) {
        scopes.add(HR_ABSENCE_CACHE_SCOPES.leaveBalances);
    }

    if (options?.includeAiValidation) {
        scopes.add(HR_ABSENCE_CACHE_SCOPES.aiValidation);
    }

    return Array.from(scopes);
}
