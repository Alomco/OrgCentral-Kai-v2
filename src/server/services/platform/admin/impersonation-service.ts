import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { ImpersonationRequest, ImpersonationSession } from '@/server/types/platform/impersonation';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import {
    buildImpersonationServiceDependencies,
    type ImpersonationServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/impersonation-service-dependencies';
import { listImpersonationRequests, listImpersonationSessions } from '@/server/use-cases/platform/admin/impersonation/list-impersonation';
import { requestImpersonation } from '@/server/use-cases/platform/admin/impersonation/request-impersonation';
import { approveImpersonationRequest } from '@/server/use-cases/platform/admin/impersonation/approve-impersonation';
import { stopImpersonationSession } from '@/server/use-cases/platform/admin/impersonation/stop-impersonation';
import type { ImpersonationRequestInput, ImpersonationApproveInput, ImpersonationStopInput } from '@/server/validators/platform/admin/impersonation-validators';

export interface ImpersonationServiceDependencies {
    impersonationRepository: IImpersonationRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface ImpersonationServiceContract {
    listRequests(authorization: RepositoryAuthorizationContext): Promise<ImpersonationRequest[]>;
    listSessions(authorization: RepositoryAuthorizationContext): Promise<ImpersonationSession[]>;
    requestImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationRequestInput,
    ): Promise<ImpersonationRequest>;
    approveImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationApproveInput,
    ): Promise<ImpersonationSession>;
    stopImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationStopInput,
    ): Promise<ImpersonationSession>;
}

export class ImpersonationService extends AbstractBaseService implements ImpersonationServiceContract {
    constructor(private readonly deps: ImpersonationServiceDependencies) {
        super();
    }

    async listRequests(authorization: RepositoryAuthorizationContext): Promise<ImpersonationRequest[]> {
        return this.runOperation(
            'platform.admin.impersonation.requests.list',
            authorization,
            undefined,
            () => listImpersonationRequests(this.deps, { authorization }),
        );
    }

    async listSessions(authorization: RepositoryAuthorizationContext): Promise<ImpersonationSession[]> {
        return this.runOperation(
            'platform.admin.impersonation.sessions.list',
            authorization,
            undefined,
            () => listImpersonationSessions(this.deps, { authorization }),
        );
    }

    async requestImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationRequestInput,
    ): Promise<ImpersonationRequest> {
        return this.runOperation(
            'platform.admin.impersonation.request',
            authorization,
            undefined,
            () => requestImpersonation(this.deps, { authorization, request }),
        );
    }

    async approveImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationApproveInput,
    ): Promise<ImpersonationSession> {
        return this.runOperation(
            'platform.admin.impersonation.approve',
            authorization,
            undefined,
            () => approveImpersonationRequest(this.deps, { authorization, request }),
        );
    }

    async stopImpersonation(
        authorization: RepositoryAuthorizationContext,
        request: ImpersonationStopInput,
    ): Promise<ImpersonationSession> {
        return this.runOperation(
            'platform.admin.impersonation.stop',
            authorization,
            undefined,
            () => stopImpersonationSession(this.deps, { authorization, request }),
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

const sharedDependencies: ImpersonationServiceDependencies = buildImpersonationServiceDependencies();
const sharedService = new ImpersonationService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): ImpersonationServiceDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }
    return buildImpersonationServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getImpersonationService(
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): ImpersonationService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new ImpersonationService(resolveDependencies(overrides, options));
}

export async function listImpersonationRequestsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): Promise<ImpersonationRequest[]> {
    return getImpersonationService(overrides, options).listRequests(authorization);
}

export async function listImpersonationSessionsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): Promise<ImpersonationSession[]> {
    return getImpersonationService(overrides, options).listSessions(authorization);
}

export async function requestImpersonationService(
    authorization: RepositoryAuthorizationContext,
    request: ImpersonationRequestInput,
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): Promise<ImpersonationRequest> {
    return getImpersonationService(overrides, options).requestImpersonation(authorization, request);
}

export async function approveImpersonationService(
    authorization: RepositoryAuthorizationContext,
    request: ImpersonationApproveInput,
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): Promise<ImpersonationSession> {
    return getImpersonationService(overrides, options).approveImpersonation(authorization, request);
}

export async function stopImpersonationService(
    authorization: RepositoryAuthorizationContext,
    request: ImpersonationStopInput,
    overrides?: Partial<ImpersonationServiceDependencies>,
    options?: ImpersonationServiceDependencyOptions,
): Promise<ImpersonationSession> {
    return getImpersonationService(overrides, options).stopImpersonation(authorization, request);
}
