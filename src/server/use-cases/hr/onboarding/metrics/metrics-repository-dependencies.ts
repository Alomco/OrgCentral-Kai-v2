import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type {
    IOnboardingMetricDefinitionRepository,
    IOnboardingMetricResultRepository,
} from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import {
    PrismaOnboardingMetricDefinitionRepository,
    PrismaOnboardingMetricResultRepository,
} from '@/server/repositories/prisma/hr/onboarding';

export interface OnboardingMetricsDependencies {
    definitionRepository: IOnboardingMetricDefinitionRepository;
    resultRepository: IOnboardingMetricResultRepository;
}

export interface OnboardingMetricsDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: Partial<OnboardingMetricsDependencies>;
}

export function buildOnboardingMetricsDependencies(
    options?: OnboardingMetricsDependencyOptions,
): OnboardingMetricsDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        definitionRepository:
            options?.overrides?.definitionRepository ?? new PrismaOnboardingMetricDefinitionRepository(repoOptions),
        resultRepository:
            options?.overrides?.resultRepository ?? new PrismaOnboardingMetricResultRepository(repoOptions),
    };
}
