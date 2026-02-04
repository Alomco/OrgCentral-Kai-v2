import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type { IOnboardingFeedbackRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-feedback-repository-contract';
import { PrismaOnboardingFeedbackRepository } from '@/server/repositories/prisma/hr/onboarding';

export interface OnboardingFeedbackDependencies {
    feedbackRepository: IOnboardingFeedbackRepository;
}

export interface OnboardingFeedbackDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: Partial<OnboardingFeedbackDependencies>;
}

export function buildOnboardingFeedbackDependencies(
    options?: OnboardingFeedbackDependencyOptions,
): OnboardingFeedbackDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        feedbackRepository:
            options?.overrides?.feedbackRepository ?? new PrismaOnboardingFeedbackRepository(repoOptions),
    };
}
