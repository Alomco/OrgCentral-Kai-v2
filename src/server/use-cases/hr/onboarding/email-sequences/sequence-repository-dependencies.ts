import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type {
    IEmailSequenceTemplateRepository,
    IEmailSequenceEnrollmentRepository,
    IEmailSequenceDeliveryRepository,
} from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import {
    PrismaEmailSequenceTemplateRepository,
    PrismaEmailSequenceEnrollmentRepository,
    PrismaEmailSequenceDeliveryRepository,
} from '@/server/repositories/prisma/hr/onboarding';

export interface EmailSequenceDependencies {
    templateRepository: IEmailSequenceTemplateRepository;
    enrollmentRepository: IEmailSequenceEnrollmentRepository;
    deliveryRepository: IEmailSequenceDeliveryRepository;
}

export interface EmailSequenceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: Partial<EmailSequenceDependencies>;
}

export function buildEmailSequenceDependencies(
    options?: EmailSequenceDependencyOptions,
): EmailSequenceDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        templateRepository:
            options?.overrides?.templateRepository ?? new PrismaEmailSequenceTemplateRepository(repoOptions),
        enrollmentRepository:
            options?.overrides?.enrollmentRepository ?? new PrismaEmailSequenceEnrollmentRepository(repoOptions),
        deliveryRepository:
            options?.overrides?.deliveryRepository ?? new PrismaEmailSequenceDeliveryRepository(repoOptions),
    };
}
