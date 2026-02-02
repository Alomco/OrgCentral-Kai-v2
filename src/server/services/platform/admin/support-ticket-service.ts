import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import {
    buildSupportTicketServiceDependencies,
    type SupportTicketServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/support-ticket-service-dependencies';
import { listSupportTickets } from '@/server/use-cases/platform/admin/support/list-support-tickets';
import { createSupportTicket } from '@/server/use-cases/platform/admin/support/create-support-ticket';
import { updateSupportTicket } from '@/server/use-cases/platform/admin/support/update-support-ticket';
import type { SupportTicketCreateInput, SupportTicketUpdateInput } from '@/server/validators/platform/admin/support-ticket-validators';

export interface SupportTicketServiceDependencies {
    supportTicketRepository: ISupportTicketRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface SupportTicketServiceContract {
    listTickets(authorization: RepositoryAuthorizationContext): Promise<SupportTicket[]>;
    createTicket(
        authorization: RepositoryAuthorizationContext,
        request: SupportTicketCreateInput,
    ): Promise<SupportTicket>;
    updateTicket(
        authorization: RepositoryAuthorizationContext,
        request: SupportTicketUpdateInput,
    ): Promise<SupportTicket>;
}

export class SupportTicketService extends AbstractBaseService implements SupportTicketServiceContract {
    constructor(private readonly deps: SupportTicketServiceDependencies) {
        super();
    }

    async listTickets(authorization: RepositoryAuthorizationContext): Promise<SupportTicket[]> {
        return this.runOperation(
            'platform.admin.support-tickets.list',
            authorization,
            undefined,
            () => listSupportTickets(this.deps, { authorization }),
        );
    }

    async createTicket(
        authorization: RepositoryAuthorizationContext,
        request: SupportTicketCreateInput,
    ): Promise<SupportTicket> {
        return this.runOperation(
            'platform.admin.support-tickets.create',
            authorization,
            undefined,
            () => createSupportTicket(this.deps, { authorization, request }),
        );
    }

    async updateTicket(
        authorization: RepositoryAuthorizationContext,
        request: SupportTicketUpdateInput,
    ): Promise<SupportTicket> {
        return this.runOperation(
            'platform.admin.support-tickets.update',
            authorization,
            undefined,
            () => updateSupportTicket(this.deps, { authorization, request }),
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

const sharedDependencies: SupportTicketServiceDependencies = buildSupportTicketServiceDependencies();
const sharedService = new SupportTicketService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<SupportTicketServiceDependencies>,
    options?: SupportTicketServiceDependencyOptions,
): SupportTicketServiceDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }
    return buildSupportTicketServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getSupportTicketService(
    overrides?: Partial<SupportTicketServiceDependencies>,
    options?: SupportTicketServiceDependencyOptions,
): SupportTicketService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new SupportTicketService(resolveDependencies(overrides, options));
}

export async function listSupportTicketsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<SupportTicketServiceDependencies>,
    options?: SupportTicketServiceDependencyOptions,
): Promise<SupportTicket[]> {
    return getSupportTicketService(overrides, options).listTickets(authorization);
}

export async function createSupportTicketService(
    authorization: RepositoryAuthorizationContext,
    request: SupportTicketCreateInput,
    overrides?: Partial<SupportTicketServiceDependencies>,
    options?: SupportTicketServiceDependencyOptions,
): Promise<SupportTicket> {
    return getSupportTicketService(overrides, options).createTicket(authorization, request);
}

export async function updateSupportTicketService(
    authorization: RepositoryAuthorizationContext,
    request: SupportTicketUpdateInput,
    overrides?: Partial<SupportTicketServiceDependencies>,
    options?: SupportTicketServiceDependencyOptions,
): Promise<SupportTicket> {
    return getSupportTicketService(overrides, options).updateTicket(authorization, request);
}
