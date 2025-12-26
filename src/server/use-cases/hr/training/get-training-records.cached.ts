import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { TrainingRecord } from '@/server/types/hr-types';
import { getTrainingService } from '@/server/services/hr/training/training-service.provider';

export interface GetTrainingRecordsForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface GetTrainingRecordsForUiResult {
    records: TrainingRecord[];
}

export async function getTrainingRecordsForUi(
    input: GetTrainingRecordsForUiInput,
): Promise<GetTrainingRecordsForUiResult> {
    async function getTrainingRecordsCached(
        cachedInput: GetTrainingRecordsForUiInput,
    ): Promise<GetTrainingRecordsForUiResult> {
        'use cache';
        cacheLife('minutes');

        const service = getTrainingService();
        const result = await service.listTrainingRecords({
            authorization: cachedInput.authorization,
            filters: { userId: cachedInput.userId },
        });

        return { records: result.records };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getTrainingService();
        const result = await service.listTrainingRecords({
            authorization: input.authorization,
            filters: { userId: input.userId },
        });

        return { records: result.records };
    }

    return getTrainingRecordsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
