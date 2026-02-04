import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOnboardingFeedbackRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-feedback-repository-contract';
import type { OnboardingFeedbackRecord } from '@/server/types/hr/onboarding-feedback';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface CreateOnboardingFeedbackInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
    rating: number;
    summary?: string | null;
    comments?: string | null;
}

export interface CreateOnboardingFeedbackDependencies {
    feedbackRepository: IOnboardingFeedbackRepository;
}

export interface CreateOnboardingFeedbackResult {
    feedback: OnboardingFeedbackRecord;
}

export async function createOnboardingFeedback(
    deps: CreateOnboardingFeedbackDependencies,
    input: CreateOnboardingFeedbackInput,
): Promise<CreateOnboardingFeedbackResult> {
    assertOnboardingConfigManager(input.authorization);

    const feedback = await deps.feedbackRepository.createFeedback({
        orgId: input.authorization.orgId,
        employeeId: input.employeeId,
        rating: input.rating,
        summary: input.summary ?? null,
        comments: input.comments ?? null,
        metadata: null,
        dataClassification: input.authorization.dataClassification,
        residencyTag: input.authorization.dataResidency,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        createdBy: input.authorization.userId,
    });

    return { feedback };
}
