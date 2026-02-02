import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import { enforcePermission } from '@/server/repositories/security';
import { parseSupportTicketUpdate, type SupportTicketUpdateInput } from '@/server/validators/platform/admin/support-ticket-validators';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';

export interface UpdateSupportTicketInput {
    authorization: RepositoryAuthorizationContext;
    request: SupportTicketUpdateInput;
}

export interface UpdateSupportTicketDependencies {
    supportTicketRepository: ISupportTicketRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function updateSupportTicket(
    deps: UpdateSupportTicketDependencies,
    input: UpdateSupportTicketInput,
): Promise<SupportTicket> {
    enforcePermission(input.authorization, 'platformSupport', 'update');

    const request = parseSupportTicketUpdate(input.request);
    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'support.update',
        }),
        10 * 60 * 1000,
        60,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for support ticket updates.');
    }
    const existing = await deps.supportTicketRepository.getTicket(input.authorization, request.ticketId);

    if (!existing) {
        throw new ValidationError('Support ticket not found.');
    }
    await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        existing.tenantId,
        'Tenant not found or not within allowed scope for support tickets.',
    );

    const now = new Date().toISOString();

    const updated: SupportTicket = {
        ...existing,
        status: request.status ?? existing.status,
        assignedTo: request.assignedTo ?? existing.assignedTo ?? null,
        slaBreached: request.slaBreached ?? existing.slaBreached,
        tags: request.tags ?? existing.tags,
        updatedAt: now,
    };

    const saved = await deps.supportTicketRepository.updateTicket(input.authorization, updated);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'support_ticket.update',
        resource: 'platformSupportTicket',
        resourceId: saved.id,
        payload: { status: saved.status, assignedTo: saved.assignedTo },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return saved;
}
