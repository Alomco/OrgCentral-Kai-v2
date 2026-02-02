import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import { enforcePermission } from '@/server/repositories/security';
import { parseSupportTicketCreate, type SupportTicketCreateInput } from '@/server/validators/platform/admin/support-ticket-validators';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';

export interface CreateSupportTicketInput {
    authorization: RepositoryAuthorizationContext;
    request: SupportTicketCreateInput;
}

export interface CreateSupportTicketDependencies {
    supportTicketRepository: ISupportTicketRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function createSupportTicket(
    deps: CreateSupportTicketDependencies,
    input: CreateSupportTicketInput,
): Promise<SupportTicket> {
    enforcePermission(input.authorization, 'platformSupport', 'create');

    const request = parseSupportTicketCreate(input.request);
    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'support.create',
        }),
        10 * 60 * 1000,
        30,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for support ticket creation.');
    }
    await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        request.tenantId,
        'Tenant not found or not within allowed scope for support tickets.',
    );
    const now = new Date().toISOString();

    const ticket: SupportTicket = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        tenantId: request.tenantId,
        requesterEmail: request.requesterEmail,
        requesterName: request.requesterName ?? null,
        subject: request.subject,
        description: request.description,
        severity: request.severity,
        status: 'NEW',
        assignedTo: null,
        slaBreached: false,
        tags: request.tags,
        metadata: null,
        createdAt: now,
        updatedAt: now,
    };

    const created = await deps.supportTicketRepository.createTicket(input.authorization, ticket);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'support_ticket.create',
        resource: 'platformSupportTicket',
        resourceId: created.id,
        payload: { tenantId: created.tenantId, severity: created.severity },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return created;
}
