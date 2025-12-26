import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PerformanceReview } from '@/server/types/hr-types';
import { getPerformanceService } from '@/server/services/hr/performance/performance-service.provider';

export interface GetPerformanceReviewsForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface GetPerformanceReviewsForUiResult {
    reviews: PerformanceReview[];
}

export async function getPerformanceReviewsForUi(
    input: GetPerformanceReviewsForUiInput,
): Promise<GetPerformanceReviewsForUiResult> {
    async function getReviewsCached(
        cachedInput: GetPerformanceReviewsForUiInput,
    ): Promise<GetPerformanceReviewsForUiResult> {
        'use cache';
        cacheLife('minutes');

        const service = getPerformanceService();
        const reviews = await service.getReviewsByEmployee({
            authorization: cachedInput.authorization,
            employeeId: cachedInput.userId ?? cachedInput.authorization.userId,
        });

        return { reviews };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getPerformanceService();
        const reviews = await service.getReviewsByEmployee({
            authorization: input.authorization,
            employeeId: input.userId ?? input.authorization.userId,
        });

        return { reviews };
    }

    return getReviewsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
