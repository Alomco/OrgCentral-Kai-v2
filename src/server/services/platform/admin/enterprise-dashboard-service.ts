import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { EnterpriseDashboardSummary } from '@/server/types/platform/enterprise-dashboard';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import {
    buildEnterpriseDashboardServiceDependencies,
    type EnterpriseDashboardServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/enterprise-dashboard-service-dependencies';
import { getEnterpriseDashboardSummary } from '@/server/use-cases/platform/admin/enterprise/get-enterprise-dashboard';

export interface EnterpriseDashboardDependencies {
    tenantRepository: IPlatformTenantRepository;
    supportTicketRepository: ISupportTicketRepository;
    billingPlanRepository: IBillingPlanRepository;
    impersonationRepository: IImpersonationRepository;
}

export interface EnterpriseDashboardServiceContract {
    getSummary(authorization: RepositoryAuthorizationContext): Promise<EnterpriseDashboardSummary>;
}

export class EnterpriseDashboardService extends AbstractBaseService implements EnterpriseDashboardServiceContract {
    constructor(private readonly deps: EnterpriseDashboardDependencies) {
        super();
    }

    async getSummary(authorization: RepositoryAuthorizationContext): Promise<EnterpriseDashboardSummary> {
        return this.runOperation(
            'platform.admin.enterprise.summary',
            authorization,
            undefined,
            () => getEnterpriseDashboardSummary(this.deps, { authorization }),
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

const sharedDependencies: EnterpriseDashboardDependencies = buildEnterpriseDashboardServiceDependencies();
const sharedService = new EnterpriseDashboardService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<EnterpriseDashboardDependencies>,
    options?: EnterpriseDashboardServiceDependencyOptions,
): EnterpriseDashboardDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }
    return buildEnterpriseDashboardServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getEnterpriseDashboardServiceInstance(
    overrides?: Partial<EnterpriseDashboardDependencies>,
    options?: EnterpriseDashboardServiceDependencyOptions,
): EnterpriseDashboardService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new EnterpriseDashboardService(resolveDependencies(overrides, options));
}

export async function getEnterpriseDashboardService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<EnterpriseDashboardDependencies>,
    options?: EnterpriseDashboardServiceDependencyOptions,
): Promise<EnterpriseDashboardSummary> {
    return getEnterpriseDashboardServiceInstance(overrides, options).getSummary(authorization);
}
