import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { PlatformToolDefinition, PlatformToolExecution } from '@/server/types/platform/platform-tools';
import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import {
    buildPlatformToolsServiceDependencies,
    type PlatformToolsServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/platform-tools-service-dependencies';
import { listPlatformTools } from '@/server/use-cases/platform/admin/tools/list-platform-tools';
import { listPlatformToolExecutions } from '@/server/use-cases/platform/admin/tools/list-platform-tool-executions';
import { executePlatformTool } from '@/server/use-cases/platform/admin/tools/execute-platform-tool';
import type { PlatformToolExecuteInput } from '@/server/validators/platform/admin/platform-tool-validators';

export interface PlatformToolsServiceDependencies {
    toolsRepository: IPlatformToolsRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface PlatformToolsServiceContract {
    listTools(authorization: RepositoryAuthorizationContext): Promise<PlatformToolDefinition[]>;
    listExecutions(
        authorization: RepositoryAuthorizationContext,
    ): Promise<PlatformToolExecution[]>;
    executeTool(
        authorization: RepositoryAuthorizationContext,
        request: PlatformToolExecuteInput,
    ): Promise<PlatformToolExecution>;
}

export class PlatformToolsService extends AbstractBaseService implements PlatformToolsServiceContract {
    constructor(private readonly deps: PlatformToolsServiceDependencies) {
        super();
    }

    async listTools(authorization: RepositoryAuthorizationContext): Promise<PlatformToolDefinition[]> {
        return this.runOperation(
            'platform.admin.tools.list',
            authorization,
            undefined,
            () => listPlatformTools({ authorization }),
        );
    }

    async listExecutions(
        authorization: RepositoryAuthorizationContext,
    ): Promise<PlatformToolExecution[]> {
        return this.runOperation(
            'platform.admin.tools.executions.list',
            authorization,
            undefined,
            () => listPlatformToolExecutions(this.deps, { authorization }),
        );
    }

    async executeTool(
        authorization: RepositoryAuthorizationContext,
        request: PlatformToolExecuteInput,
    ): Promise<PlatformToolExecution> {
        return this.runOperation(
            'platform.admin.tools.execute',
            authorization,
            undefined,
            () => executePlatformTool(this.deps, { authorization, request }),
        );
    }

    private runOperation<TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ): Promise<TResult> {
        const context = this.buildContext(authorization, { metadata });
        return this.executeInServiceContext(context, operation, handler);
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}

const sharedDependencies: PlatformToolsServiceDependencies = buildPlatformToolsServiceDependencies();
const sharedService = new PlatformToolsService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<PlatformToolsServiceDependencies>,
    options?: PlatformToolsServiceDependencyOptions,
): PlatformToolsServiceDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }

    return buildPlatformToolsServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getPlatformToolsService(
    overrides?: Partial<PlatformToolsServiceDependencies>,
    options?: PlatformToolsServiceDependencyOptions,
): PlatformToolsService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new PlatformToolsService(resolveDependencies(overrides, options));
}

export async function listPlatformToolsService(
    authorization: RepositoryAuthorizationContext,
): Promise<PlatformToolDefinition[]> {
    return getPlatformToolsService().listTools(authorization);
}

export async function listPlatformToolExecutionsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<PlatformToolsServiceDependencies>,
    options?: PlatformToolsServiceDependencyOptions,
): Promise<PlatformToolExecution[]> {
    return getPlatformToolsService(overrides, options).listExecutions(authorization);
}

export async function executePlatformToolService(
    authorization: RepositoryAuthorizationContext,
    request: PlatformToolExecuteInput,
    overrides?: Partial<PlatformToolsServiceDependencies>,
    options?: PlatformToolsServiceDependencyOptions,
): Promise<PlatformToolExecution> {
    return getPlatformToolsService(overrides, options).executeTool(authorization, request);
}
