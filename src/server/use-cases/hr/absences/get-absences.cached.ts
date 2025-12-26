import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import { getAbsenceService } from '@/server/services/hr/absences/absence-service.provider';

export interface GetAbsencesForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    includeClosed?: boolean;
}

export interface GetAbsencesForUiResult {
    absences: UnplannedAbsence[];
}

export async function getAbsencesForUi(
    input: GetAbsencesForUiInput,
): Promise<GetAbsencesForUiResult> {
    async function getAbsencesCached(
        cachedInput: GetAbsencesForUiInput,
    ): Promise<GetAbsencesForUiResult> {
        'use cache';
        cacheLife('minutes');

        const service = getAbsenceService();
        const result = await service.listAbsences({
            authorization: cachedInput.authorization,
            filters: {
                userId: cachedInput.userId,
                includeClosed: cachedInput.includeClosed,
            },
        });

        return { absences: result.absences };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getAbsenceService();
        const result = await service.listAbsences({
            authorization: input.authorization,
            filters: {
                userId: input.userId,
                includeClosed: input.includeClosed,
            },
        });

        return { absences: result.absences };
    }

    return getAbsencesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
