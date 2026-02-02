import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import { enforcePermission } from '@/server/repositories/security';
import { parseBreakGlassApprove, type BreakGlassApproveInput } from '@/server/validators/platform/admin/break-glass-validators';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';

export interface ApproveBreakGlassInput {
    authorization: RepositoryAuthorizationContext;
    request: BreakGlassApproveInput;
}

export interface ApproveBreakGlassDependencies {
    breakGlassRepository: IBreakGlassRepository;
}

export interface ApproveBreakGlassResult {
    approval: BreakGlassApproval;
}

export async function approveBreakGlassApproval(
    deps: ApproveBreakGlassDependencies,
    input: ApproveBreakGlassInput,
): Promise<ApproveBreakGlassResult> {
    enforcePermission(input.authorization, 'platformBreakGlass', 'approve');
    const request = parseBreakGlassApprove(input.request);

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'break-glass.approve',
        }),
        10 * 60 * 1000,
        12,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for break-glass approvals.');
    }

    const approval = await deps.breakGlassRepository.getApproval(input.authorization, request.approvalId);

    if (!approval) {
        throw new ValidationError('Break-glass approval not found.');
    }
    if (approval.status !== 'PENDING') {
        throw new ValidationError('Break-glass approval is not pending.');
    }
    if (approval.requestedBy === input.authorization.userId) {
        throw new ValidationError('Approver must be different from requester.');
    }

    const now = new Date();
    if (new Date(approval.expiresAt) <= now) {
        throw new ValidationError('Break-glass approval has expired.');
    }

    const updated: BreakGlassApproval = {
        ...approval,
        status: 'APPROVED',
        approvedBy: input.authorization.userId,
        approvedAt: now.toISOString(),
    };

    await deps.breakGlassRepository.updateApproval(input.authorization, updated);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'AUTH',
        action: 'break_glass.approved',
        resource: 'breakGlassApproval',
        resourceId: updated.id,
        payload: {
            scope: updated.scope,
            targetOrgId: updated.targetOrgId,
            action: updated.action,
            resourceId: updated.resourceId,
        },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return { approval: updated };
}
