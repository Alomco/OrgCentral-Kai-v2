import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { PerformanceRepository } from '@/server/repositories/contracts/hr/performance/performance-repository.contract';

export interface PerformanceServiceRuntime {
    ensureOrgAccess: (
        authorization: RepositoryAuthorizationContext,
        guard?: {
            action?: string;
            resourceType?: string;
            resourceAttributes?: Record<string, unknown>;
        },
    ) => Promise<void>;
    buildContext: (
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ) => ServiceExecutionContext;
    executeInServiceContext: <TResult>(
        context: ServiceExecutionContext,
        operation: string,
        handler: () => Promise<TResult>,
    ) => Promise<TResult>;
    repo: (authorization: RepositoryAuthorizationContext) => PerformanceRepository;
}
