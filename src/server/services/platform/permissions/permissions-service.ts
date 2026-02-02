import type { AppPermissionCreateInput } from '@/server/repositories/contracts/platform/permissions/app-permission-repository-contract';
import { buildAppPermissionServiceDependencies, type AppPermissionServiceDependencies } from '@/server/repositories/providers/platform/permissions/app-permission-service-dependencies';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { createAppPermission, type CreateAppPermissionResult } from '@/server/use-cases/platform/permissions/create-app-permission';
import { getAppPermissions, type GetAppPermissionsResult } from '@/server/use-cases/platform/permissions/get-app-permissions';

const defaultDependencies = buildAppPermissionServiceDependencies();

export interface PlatformPermissionServiceContract {
    listPermissions(authorization: RepositoryAuthorizationContext): Promise<GetAppPermissionsResult>;
    createPermission(
        authorization: RepositoryAuthorizationContext,
        data: AppPermissionCreateInput,
    ): Promise<CreateAppPermissionResult>;
}

export class PlatformPermissionService extends AbstractBaseService implements PlatformPermissionServiceContract {
    constructor(private readonly dependencies: AppPermissionServiceDependencies) {
        super();
    }

    async listPermissions(authorization: RepositoryAuthorizationContext): Promise<GetAppPermissionsResult> {
        return this.runOperation(
            'platform.permissions.list',
            authorization,
            undefined,
            () => getAppPermissions(this.dependencies, { authorization }),
        );
    }

    async createPermission(
        authorization: RepositoryAuthorizationContext,
        data: AppPermissionCreateInput,
    ): Promise<CreateAppPermissionResult> {
        return this.runOperation(
            'platform.permissions.create',
            authorization,
            undefined,
            () => createAppPermission(this.dependencies, { authorization, data }),
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

function resolveDependencies(overrides?: Partial<AppPermissionServiceDependencies>): AppPermissionServiceDependencies {
    if (!overrides) {
        return defaultDependencies;
    }
    return { ...defaultDependencies, ...overrides };
}

const sharedService = new PlatformPermissionService(defaultDependencies);

export function getPlatformPermissionService(
    overrides?: Partial<AppPermissionServiceDependencies>,
): PlatformPermissionService {
    if (!overrides) {
        return sharedService;
    }
    return new PlatformPermissionService(resolveDependencies(overrides));
}

export async function listPlatformPermissions(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<AppPermissionServiceDependencies>,
): Promise<GetAppPermissionsResult> {
    return getPlatformPermissionService(overrides).listPermissions(authorization);
}

export async function createPlatformPermission(
    authorization: RepositoryAuthorizationContext,
    data: AppPermissionCreateInput,
    overrides?: Partial<AppPermissionServiceDependencies>,
): Promise<CreateAppPermissionResult> {
    return getPlatformPermissionService(overrides).createPermission(authorization, data);
}

export type { AppPermissionCreateInput };