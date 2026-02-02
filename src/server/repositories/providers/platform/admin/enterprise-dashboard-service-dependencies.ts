import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';
import { PrismaSupportTicketRepository } from '@/server/repositories/prisma/platform/admin/prisma-support-ticket-repository';
import { PrismaBillingPlanRepository } from '@/server/repositories/prisma/platform/admin/prisma-billing-plan-repository';
import { PrismaImpersonationRepository } from '@/server/repositories/prisma/platform/admin/prisma-impersonation-repository';

export interface EnterpriseDashboardRepositoryDependencies {
    tenantRepository: IPlatformTenantRepository;
    supportTicketRepository: ISupportTicketRepository;
    billingPlanRepository: IBillingPlanRepository;
    impersonationRepository: IImpersonationRepository;
}

export type EnterpriseDashboardRepositoryOverrides = Partial<EnterpriseDashboardRepositoryDependencies>;

export interface EnterpriseDashboardServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: EnterpriseDashboardRepositoryOverrides;
}

export function buildEnterpriseDashboardServiceDependencies(
    options?: EnterpriseDashboardServiceDependencyOptions,
): EnterpriseDashboardRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
        supportTicketRepository:
            options?.overrides?.supportTicketRepository ?? new PrismaSupportTicketRepository(repoOptions),
        billingPlanRepository:
            options?.overrides?.billingPlanRepository ?? new PrismaBillingPlanRepository(repoOptions),
        impersonationRepository:
            options?.overrides?.impersonationRepository ?? new PrismaImpersonationRepository(repoOptions),
    };
}
