import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaEnterpriseAdminRepository } from '@/server/repositories/prisma/org/enterprise/prisma-enterprise-admin-repository';
import type { IEnterpriseAdminRepository } from '@/server/repositories/contracts/org/enterprise/enterprise-admin-repository-contract';

export interface EnterpriseAdminRepositoryDependencies {
    enterpriseAdminRepository: IEnterpriseAdminRepository;
}

export type EnterpriseAdminRepositoryOverrides = Partial<EnterpriseAdminRepositoryDependencies>;

export interface EnterpriseAdminRepositoryDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: EnterpriseAdminRepositoryOverrides;
}

export function buildEnterpriseAdminRepositoryDependencies(
    options?: EnterpriseAdminRepositoryDependencyOptions,
): EnterpriseAdminRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;

    return {
        enterpriseAdminRepository:
            options?.overrides?.enterpriseAdminRepository ??
            new PrismaEnterpriseAdminRepository({
                prisma: prismaClient,
                trace: options?.prismaOptions?.trace,
                onAfterWrite: options?.prismaOptions?.onAfterWrite,
            }),
    };
}
