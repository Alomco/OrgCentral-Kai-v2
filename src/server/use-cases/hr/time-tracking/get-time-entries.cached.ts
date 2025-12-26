import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { TimeEntry } from '@/server/types/hr-ops-types';
import { getTimeTrackingService } from '@/server/services/hr/time-tracking/time-tracking-service.provider';

export interface GetTimeEntriesForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface GetTimeEntriesForUiResult {
    entries: TimeEntry[];
}

export async function getTimeEntriesForUi(
    input: GetTimeEntriesForUiInput,
): Promise<GetTimeEntriesForUiResult> {
    async function getTimeEntriesCached(
        cachedInput: GetTimeEntriesForUiInput,
    ): Promise<GetTimeEntriesForUiResult> {
        'use cache';
        cacheLife('minutes');

        const service = getTimeTrackingService();
        const result = await service.listTimeEntries({
            authorization: cachedInput.authorization,
            filters: { userId: cachedInput.userId },
        });

        return { entries: result.entries };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getTimeTrackingService();
        const result = await service.listTimeEntries({
            authorization: input.authorization,
            filters: { userId: input.userId },
        });

        return { entries: result.entries };
    }

    return getTimeEntriesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
