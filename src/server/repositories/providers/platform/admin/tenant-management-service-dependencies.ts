import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';
import { PrismaBreakGlassRepository } from '@/server/repositories/prisma/platform/admin/prisma-break-glass-repository';

export interface TenantManagementRepositoryDependencies {
    tenantRepository: IPlatformTenantRepository;
    breakGlassRepository: IBreakGlassRepository;
}

export type TenantManagementRepositoryOverrides = Partial<TenantManagementRepositoryDependencies>;

export interface TenantManagementServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: TenantManagementRepositoryOverrides;
}

export function buildTenantManagementServiceDependencies(
    options?: TenantManagementServiceDependencyOptions,
): TenantManagementRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
        breakGlassRepository:
            options?.overrides?.breakGlassRepository ?? new PrismaBreakGlassRepository(repoOptions),
    };
}
