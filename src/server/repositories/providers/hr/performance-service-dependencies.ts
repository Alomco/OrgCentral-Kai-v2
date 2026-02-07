import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaPerformanceRepository } from '@/server/repositories/prisma/hr/performance';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import type { PerformanceRepository } from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { CacheScope } from '@/server/repositories/cache-scopes';

export interface PerformanceRepositoryDependencies {
  repositoryFactory: (authorization: RepositoryAuthorizationContext) => PerformanceRepository;
}

export type Overrides = Partial<PerformanceRepositoryDependencies>;

export interface PerformanceServiceDependencyOptions {
  prismaOptions?: PrismaOptions;
  overrides?: Overrides;
}

export function buildPerformanceServiceDependencies(
  options?: PerformanceServiceDependencyOptions,
): PerformanceRepositoryDependencies {

  return {
    repositoryFactory: options?.overrides?.repositoryFactory ?? ((authorization) => {
      const { orgId, dataClassification, dataResidency } = authorization;

      return new PrismaPerformanceRepository(orgId, dataClassification, dataResidency, {
        ...(options?.prismaOptions ?? {}),
        onAfterWrite: options?.prismaOptions?.onAfterWrite ?? (async (tenantId: string, scopes?: CacheScope[]) => {
          if (!scopes?.length) {
            return;
          }
          await Promise.all(
            scopes.map((scope) =>
              invalidateOrgCache(tenantId, scope, dataClassification, dataResidency),
            ),
          );
        }),
      });
    }),
  };
}
