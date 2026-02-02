import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';

export interface IPlatformToolsRepository {
    listExecutions(context: RepositoryAuthorizationContext): Promise<PlatformToolExecution[]>;
    createExecution(
        context: RepositoryAuthorizationContext,
        execution: PlatformToolExecution,
    ): Promise<PlatformToolExecution>;
    updateExecution(
        context: RepositoryAuthorizationContext,
        execution: PlatformToolExecution,
    ): Promise<PlatformToolExecution>;
}
