import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import { PrismaImpersonationRepository } from '@/server/repositories/prisma/platform/admin/prisma-impersonation-repository';
import { PrismaBreakGlassRepository } from '@/server/repositories/prisma/platform/admin/prisma-break-glass-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface ImpersonationRepositoryDependencies {
    impersonationRepository: IImpersonationRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type ImpersonationRepositoryOverrides = Partial<ImpersonationRepositoryDependencies>;

export interface ImpersonationServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: ImpersonationRepositoryOverrides;
}

export function buildImpersonationServiceDependencies(
    options?: ImpersonationServiceDependencyOptions,
): ImpersonationRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        impersonationRepository:
            options?.overrides?.impersonationRepository ?? new PrismaImpersonationRepository(repoOptions),
        breakGlassRepository:
            options?.overrides?.breakGlassRepository ?? new PrismaBreakGlassRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
