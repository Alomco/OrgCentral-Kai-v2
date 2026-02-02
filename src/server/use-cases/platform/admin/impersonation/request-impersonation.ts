import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ImpersonationRequest } from '@/server/types/platform/impersonation';
import { enforcePermission } from '@/server/repositories/security';
import { parseImpersonationRequest, type ImpersonationRequestInput } from '@/server/validators/platform/admin/impersonation-validators';
import { requireBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/require-break-glass';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { enforceImpersonationSecurity } from './impersonation-guards';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';

export interface RequestImpersonationInput {
    authorization: RepositoryAuthorizationContext;
    request: ImpersonationRequestInput;
}

export interface RequestImpersonationDependencies {
    impersonationRepository: IImpersonationRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function requestImpersonation(
    deps: RequestImpersonationDependencies,
    input: RequestImpersonationInput,
): Promise<ImpersonationRequest> {
    enforcePermission(input.authorization, 'platformImpersonation', 'request');

    const request = parseImpersonationRequest(input.request);
    const breakGlassAction = 'impersonation.request';

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: breakGlassAction,
        }),
        10 * 60 * 1000,
        6,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for impersonation requests.');
    }

    await enforceImpersonationSecurity(input.authorization);
    await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        request.targetOrgId,
        'Target tenant not found or not within allowed scope for impersonation.',
    );
    await requireBreakGlassApproval(deps.breakGlassRepository, {
        authorization: input.authorization,
        approvalId: request.breakGlassApprovalId,
        scope: 'impersonation',
        targetOrgId: request.targetOrgId,
        action: breakGlassAction,
        resourceId: request.targetUserId,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.expiresInMinutes * 60 * 1000);

    const impersonationRequest: ImpersonationRequest = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        requestedBy: input.authorization.userId,
        targetUserId: request.targetUserId,
        targetOrgId: request.targetOrgId,
        reason: request.reason,
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };

    const created = await deps.impersonationRepository.createRequest(input.authorization, impersonationRequest);

    await requireBreakGlassApproval(deps.breakGlassRepository, {
        authorization: input.authorization,
        approvalId: request.breakGlassApprovalId,
        scope: 'impersonation',
        targetOrgId: request.targetOrgId,
        action: breakGlassAction,
        resourceId: request.targetUserId,
        consume: true,
    });

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'AUTH',
        action: 'impersonation.requested',
        resource: 'platformImpersonationRequest',
        resourceId: created.id,
        payload: { targetUserId: created.targetUserId, targetOrgId: created.targetOrgId },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return created;
}
