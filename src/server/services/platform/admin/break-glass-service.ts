import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import {
    buildBreakGlassServiceDependencies,
    type BreakGlassServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/break-glass-service-dependencies';
import { requestBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/request-break-glass';
import { approveBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/approve-break-glass';
import { listBreakGlassApprovals } from '@/server/use-cases/platform/admin/break-glass/list-break-glass';
import type { BreakGlassListFilters } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { BreakGlassApproveInput, BreakGlassRequestInput } from '@/server/validators/platform/admin/break-glass-validators';

export interface BreakGlassServiceDependencies {
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface BreakGlassServiceContract {
    requestBreakGlass(
        authorization: RepositoryAuthorizationContext,
        request: BreakGlassRequestInput,
    ): Promise<BreakGlassApproval>;
    approveBreakGlass(
        authorization: RepositoryAuthorizationContext,
        request: BreakGlassApproveInput,
    ): Promise<BreakGlassApproval>;
    listBreakGlassApprovals(
        authorization: RepositoryAuthorizationContext,
        filters?: BreakGlassListFilters,
    ): Promise<BreakGlassApproval[]>;
}

export class BreakGlassService extends AbstractBaseService implements BreakGlassServiceContract {
    constructor(private readonly deps: BreakGlassServiceDependencies) {
        super();
    }

    async requestBreakGlass(
        authorization: RepositoryAuthorizationContext,
        request: BreakGlassRequestInput,
    ): Promise<BreakGlassApproval> {
        return this.runOperation(
            'platform.admin.break-glass.request',
            authorization,
            undefined,
            async () => {
                const result = await requestBreakGlassApproval(this.deps, { authorization, request });
                return result.approval;
            },
        );
    }

    async approveBreakGlass(
        authorization: RepositoryAuthorizationContext,
        request: BreakGlassApproveInput,
    ): Promise<BreakGlassApproval> {
        return this.runOperation(
            'platform.admin.break-glass.approve',
            authorization,
            undefined,
            async () => {
                const result = await approveBreakGlassApproval(this.deps, { authorization, request });
                return result.approval;
            },
        );
    }

    async listBreakGlassApprovals(
        authorization: RepositoryAuthorizationContext,
        filters?: BreakGlassListFilters,
    ): Promise<BreakGlassApproval[]> {
        return this.runOperation(
            'platform.admin.break-glass.list',
            authorization,
            undefined,
            () => listBreakGlassApprovals(this.deps, { authorization, filters }),
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

const sharedDependencies: BreakGlassServiceDependencies = buildBreakGlassServiceDependencies();
const sharedService = new BreakGlassService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<BreakGlassServiceDependencies>,
    options?: BreakGlassServiceDependencyOptions,
): BreakGlassServiceDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }
    return buildBreakGlassServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getBreakGlassService(
    overrides?: Partial<BreakGlassServiceDependencies>,
    options?: BreakGlassServiceDependencyOptions,
): BreakGlassService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new BreakGlassService(resolveDependencies(overrides, options));
}

export async function requestBreakGlassService(
    authorization: RepositoryAuthorizationContext,
    request: BreakGlassRequestInput,
    overrides?: Partial<BreakGlassServiceDependencies>,
    options?: BreakGlassServiceDependencyOptions,
): Promise<BreakGlassApproval> {
    return getBreakGlassService(overrides, options).requestBreakGlass(authorization, request);
}

export async function approveBreakGlassService(
    authorization: RepositoryAuthorizationContext,
    request: BreakGlassApproveInput,
    overrides?: Partial<BreakGlassServiceDependencies>,
    options?: BreakGlassServiceDependencyOptions,
): Promise<BreakGlassApproval> {
    return getBreakGlassService(overrides, options).approveBreakGlass(authorization, request);
}

export async function listBreakGlassApprovalsService(
    authorization: RepositoryAuthorizationContext,
    filters?: BreakGlassListFilters,
    overrides?: Partial<BreakGlassServiceDependencies>,
    options?: BreakGlassServiceDependencyOptions,
): Promise<BreakGlassApproval[]> {
    return getBreakGlassService(overrides, options).listBreakGlassApprovals(authorization, filters);
}
