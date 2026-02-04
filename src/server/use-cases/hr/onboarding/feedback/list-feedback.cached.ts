import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_LONG } from '@/server/repositories/cache-profiles';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { AuthorizationError } from '@/server/errors';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OnboardingFeedbackRecord } from '@/server/types/hr/onboarding-feedback';
import { CACHE_SCOPE_ONBOARDING_FEEDBACK } from '@/server/repositories/cache-scopes';
import { buildOnboardingFeedbackDependencies } from './feedback-repository-dependencies';
import { listOnboardingFeedback } from './list-feedback';

export interface GetOnboardingFeedbackForUiInput {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string;
}

export interface GetOnboardingFeedbackForUiResult {
    feedback: OnboardingFeedbackRecord[];
    canManageFeedback: boolean;
}

async function loadFeedback(
    input: GetOnboardingFeedbackForUiInput,
): Promise<GetOnboardingFeedbackForUiResult> {
    try {
        const result = await listOnboardingFeedback(
            { feedbackRepository: buildOnboardingFeedbackDependencies().feedbackRepository },
            input,
        );
        return { feedback: result.feedback, canManageFeedback: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { feedback: [], canManageFeedback: false };
        }
        throw error;
    }
}

export async function getOnboardingFeedbackForUi(
    input: GetOnboardingFeedbackForUiInput,
): Promise<GetOnboardingFeedbackForUiResult> {
    async function getFeedbackCached(
        cachedInput: GetOnboardingFeedbackForUiInput,
    ): Promise<GetOnboardingFeedbackForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_LONG);

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_FEEDBACK,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        return loadFeedback(cachedInput);
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadFeedback(input);
    }

    return getFeedbackCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
