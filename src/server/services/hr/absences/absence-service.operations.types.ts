import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceServiceDependencies } from './absence-service';

export interface AbsenceServiceRuntime {
    dependencies: AbsenceServiceDependencies;
    ensureOrgAccess: (
        authorization: RepositoryAuthorizationContext,
        guard?: {
            action?: string;
            resourceType?: string;
            resourceAttributes?: Record<string, unknown>;
        },
    ) => Promise<void>;
    runOperation: <TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ) => Promise<TResult>;
}
