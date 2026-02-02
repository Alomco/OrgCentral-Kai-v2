import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import { PrismaBreakGlassRepository } from '@/server/repositories/prisma/platform/admin/prisma-break-glass-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface BreakGlassRepositoryDependencies {
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type BreakGlassRepositoryOverrides = Partial<BreakGlassRepositoryDependencies>;

export interface BreakGlassServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: BreakGlassRepositoryOverrides;
}

export function buildBreakGlassServiceDependencies(
    options?: BreakGlassServiceDependencyOptions,
): BreakGlassRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        breakGlassRepository:
            options?.overrides?.breakGlassRepository ?? new PrismaBreakGlassRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
