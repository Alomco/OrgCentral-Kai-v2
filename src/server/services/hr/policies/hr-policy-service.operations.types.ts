import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { HrPolicyServiceDependencies } from './hr-policy-service.types';

export interface HrPolicyServiceRuntime {
    dependencies: HrPolicyServiceDependencies;
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
        options: { metadata?: Record<string, unknown> },
    ) => ServiceExecutionContext;
    executeInServiceContext: <TResult>(
        context: ServiceExecutionContext,
        operation: string,
        handler: () => Promise<TResult>,
    ) => Promise<TResult>;
    coerceAuthorization: (value: unknown) => RepositoryAuthorizationContext;
}
