import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { PlatformTenantDetail, PlatformTenantListResult } from '@/server/types/platform/tenant-admin';
import type { PlatformTenantMetrics } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import {
    buildTenantManagementServiceDependencies,
    type TenantManagementServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/tenant-management-service-dependencies';
import { listPlatformTenants } from '@/server/use-cases/platform/admin/tenants/list-platform-tenants';
import { getPlatformTenantDetail } from '@/server/use-cases/platform/admin/tenants/get-platform-tenant-detail';
import { updatePlatformTenantStatus } from '@/server/use-cases/platform/admin/tenants/update-platform-tenant-status';
import { getPlatformTenantMetrics } from '@/server/use-cases/platform/admin/tenants/get-platform-tenant-metrics';
import type { TenantListQueryInput, TenantStatusActionInput } from '@/server/validators/platform/admin/tenant-validators';

export interface TenantManagementDependencies {
    tenantRepository: IPlatformTenantRepository;
    breakGlassRepository: IBreakGlassRepository;
}

export interface TenantManagementServiceContract {
    listTenants(
        authorization: RepositoryAuthorizationContext,
        query: TenantListQueryInput,
    ): Promise<PlatformTenantListResult>;
    getTenantDetail(
        authorization: RepositoryAuthorizationContext,
        tenantId: string,
    ): Promise<PlatformTenantDetail>;
    updateTenantStatus(
        authorization: RepositoryAuthorizationContext,
        request: TenantStatusActionInput,
    ): Promise<PlatformTenantDetail>;
    getTenantMetrics(authorization: RepositoryAuthorizationContext): Promise<PlatformTenantMetrics>;
}

export class TenantManagementService extends AbstractBaseService implements TenantManagementServiceContract {
    constructor(private readonly deps: TenantManagementDependencies) {
        super();
    }

    async listTenants(
        authorization: RepositoryAuthorizationContext,
        query: TenantListQueryInput,
    ): Promise<PlatformTenantListResult> {
        return this.runOperation(
            'platform.admin.tenants.list',
            authorization,
            undefined,
            () => listPlatformTenants(this.deps, { authorization, query }),
        );
    }

    async getTenantDetail(
        authorization: RepositoryAuthorizationContext,
        tenantId: string,
    ): Promise<PlatformTenantDetail> {
        return this.runOperation(
            'platform.admin.tenants.get',
            authorization,
            undefined,
            () => getPlatformTenantDetail(this.deps, { authorization, tenantId }),
        );
    }

    async updateTenantStatus(
        authorization: RepositoryAuthorizationContext,
        request: TenantStatusActionInput,
    ): Promise<PlatformTenantDetail> {
        return this.runOperation(
            'platform.admin.tenants.update-status',
            authorization,
            undefined,
            () => updatePlatformTenantStatus(this.deps, { authorization, request }),
        );
    }

    async getTenantMetrics(authorization: RepositoryAuthorizationContext): Promise<PlatformTenantMetrics> {
        return this.runOperation(
            'platform.admin.tenants.metrics',
            authorization,
            undefined,
            () => getPlatformTenantMetrics(this.deps, { authorization }),
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

const sharedDependencies: TenantManagementDependencies = buildTenantManagementServiceDependencies();
const sharedService = new TenantManagementService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): TenantManagementDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }
    return buildTenantManagementServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getTenantManagementService(
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): TenantManagementService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new TenantManagementService(resolveDependencies(overrides, options));
}

export async function listPlatformTenantsService(
    authorization: RepositoryAuthorizationContext,
    query: TenantListQueryInput,
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): Promise<PlatformTenantListResult> {
    return getTenantManagementService(overrides, options).listTenants(authorization, query);
}

export async function getPlatformTenantDetailService(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): Promise<PlatformTenantDetail> {
    return getTenantManagementService(overrides, options).getTenantDetail(authorization, tenantId);
}

export async function updatePlatformTenantStatusService(
    authorization: RepositoryAuthorizationContext,
    request: TenantStatusActionInput,
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): Promise<PlatformTenantDetail> {
    return getTenantManagementService(overrides, options).updateTenantStatus(authorization, request);
}

export async function getPlatformTenantMetricsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<TenantManagementDependencies>,
    options?: TenantManagementServiceDependencyOptions,
): Promise<PlatformTenantMetrics> {
    return getTenantManagementService(overrides, options).getTenantMetrics(authorization);
}
