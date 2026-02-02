import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import { PrismaSupportTicketRepository } from '@/server/repositories/prisma/platform/admin/prisma-support-ticket-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface SupportTicketRepositoryDependencies {
    supportTicketRepository: ISupportTicketRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type SupportTicketRepositoryOverrides = Partial<SupportTicketRepositoryDependencies>;

export interface SupportTicketServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: SupportTicketRepositoryOverrides;
}

export function buildSupportTicketServiceDependencies(
    options?: SupportTicketServiceDependencyOptions,
): SupportTicketRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        supportTicketRepository:
            options?.overrides?.supportTicketRepository ?? new PrismaSupportTicketRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
