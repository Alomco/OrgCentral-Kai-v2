import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListSupportTicketsInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListSupportTicketsDependencies {
    supportTicketRepository: ISupportTicketRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function listSupportTickets(
    deps: ListSupportTicketsDependencies,
    input: ListSupportTicketsInput,
): Promise<SupportTicket[]> {
    enforcePermission(input.authorization, 'platformSupport', 'read');
    const tickets = await deps.supportTicketRepository.listTickets(input.authorization);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        tickets,
        (ticket) => ticket.tenantId,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.support.list',
        resource: 'platformSupportTicket',
        payload: { count: scoped.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}
