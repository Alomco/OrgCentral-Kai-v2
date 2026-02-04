import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type { IOnboardingWorkflowTemplateRepository, IOnboardingWorkflowRunRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import {
    PrismaOnboardingWorkflowTemplateRepository,
    PrismaOnboardingWorkflowRunRepository,
} from '@/server/repositories/prisma/hr/onboarding';

export interface OnboardingWorkflowDependencies {
    workflowTemplateRepository: IOnboardingWorkflowTemplateRepository;
    workflowRunRepository: IOnboardingWorkflowRunRepository;
}

export interface OnboardingWorkflowDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: Partial<OnboardingWorkflowDependencies>;
}

export function buildOnboardingWorkflowDependencies(
    options?: OnboardingWorkflowDependencyOptions,
): OnboardingWorkflowDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        workflowTemplateRepository:
            options?.overrides?.workflowTemplateRepository ??
            new PrismaOnboardingWorkflowTemplateRepository(repoOptions),
        workflowRunRepository:
            options?.overrides?.workflowRunRepository ?? new PrismaOnboardingWorkflowRunRepository(repoOptions),
    };
}
