import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IPlatformSubscriptionRepository } from '@/server/repositories/contracts/platform/admin/platform-subscription-repository-contract';
import { PrismaBillingPlanRepository } from '@/server/repositories/prisma/platform/admin/prisma-billing-plan-repository';
import { PrismaPlatformSubscriptionRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-subscription-repository';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface BillingPlanRepositoryDependencies {
    billingPlanRepository: IBillingPlanRepository;
    subscriptionRepository: IPlatformSubscriptionRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type BillingPlanRepositoryOverrides = Partial<BillingPlanRepositoryDependencies>;

export interface BillingPlanServiceDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: BillingPlanRepositoryOverrides;
}

export function buildBillingPlanServiceDependencies(
    options?: BillingPlanServiceDependencyOptions,
): BillingPlanRepositoryDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        billingPlanRepository:
            options?.overrides?.billingPlanRepository ?? new PrismaBillingPlanRepository(repoOptions),
        subscriptionRepository:
            options?.overrides?.subscriptionRepository ?? new PrismaPlatformSubscriptionRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
