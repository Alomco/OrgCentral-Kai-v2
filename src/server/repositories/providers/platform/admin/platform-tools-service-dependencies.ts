import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import { PrismaPlatformToolsRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tools-repository';
import { PrismaBreakGlassRepository } from '@/server/repositories/prisma/platform/admin/prisma-break-glass-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface PlatformToolsRepositoryDependencies {
    toolsRepository: IPlatformToolsRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type PlatformToolsRepositoryOverrides = Partial<PlatformToolsRepositoryDependencies>;

export interface PlatformToolsServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: PlatformToolsRepositoryOverrides;
}

export function buildPlatformToolsServiceDependencies(
    options?: PlatformToolsServiceDependencyOptions,
): PlatformToolsRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        toolsRepository:
            options?.overrides?.toolsRepository ?? new PrismaPlatformToolsRepository(repoOptions),
        breakGlassRepository:
            options?.overrides?.breakGlassRepository ?? new PrismaBreakGlassRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
