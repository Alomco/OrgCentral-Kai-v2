import { PerformanceService, type PerformanceServiceDependencies } from './performance-service';
import { PrismaPerformanceRepository } from '@/server/repositories/prisma/hr/performance';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export interface PerformanceServiceProviderOptions {
    overrides?: Partial<PerformanceServiceDependencies>;
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

const sharedDefaultOptions: PerformanceServiceProviderOptions = {};
const DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
const DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';

export function getPerformanceService(options: PerformanceServiceProviderOptions = sharedDefaultOptions): PerformanceService {
    const prismaOptions = options.prismaOptions;

    const defaults: PerformanceServiceDependencies = {
        repositoryFactory: (orgId: string) =>
            new PrismaPerformanceRepository(orgId, {
                ...(prismaOptions ?? {}),
                onAfterWrite: prismaOptions?.onAfterWrite ?? (async (tenantId: string, scopes?: string[]) => {
                    if (!scopes?.length) {
                        return;
                    }
                    await Promise.all(
                        scopes.map((scope) =>
                            invalidateOrgCache(tenantId, scope, DEFAULT_CLASSIFICATION, DEFAULT_RESIDENCY),
                        ),
                    );
                }),
            }),
    };

    if (!options.overrides || Object.keys(options.overrides).length === 0) {
        return new PerformanceService(defaults);
    }

    return new PerformanceService({
        ...defaults,
        ...options.overrides,
    });
}

export type PerformanceServiceContract = Pick<
    PerformanceService,
    | 'getReviewById'
    | 'getReviewsByEmployee'
    | 'getGoalsByReviewId'
    | 'createReview'
    | 'updateReview'
    | 'deleteReview'
    | 'addGoal'
    | 'updateGoal'
    | 'deleteGoal'
>;

export const defaultPerformanceServiceProvider: { service: PerformanceServiceContract } = {
    service: getPerformanceService(),
};
