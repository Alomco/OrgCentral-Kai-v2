import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { BreakGlassScope } from '@/server/types/platform/break-glass';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface RequireBreakGlassInput {
    authorization: RepositoryAuthorizationContext;
    approvalId?: string | null;
    scope: BreakGlassScope;
    targetOrgId: string;
    action: string;
    resourceId: string;
    consume?: boolean;
}

export async function requireBreakGlassApproval(
    repository: IBreakGlassRepository,
    input: RequireBreakGlassInput,
): Promise<void> {
    if (!input.approvalId) {
        throw new ValidationError('Break-glass approval is required for this operation.');
    }

    const approval = await repository.getApproval(input.authorization, input.approvalId);
    if (!approval) {
        throw new ValidationError('Break-glass approval not found.');
    }

    const now = new Date();
    if (approval.scope !== input.scope) {
        throw new ValidationError('Break-glass approval scope mismatch.');
    }
    if (approval.status !== 'APPROVED') {
        throw new ValidationError('Break-glass approval is not approved.');
    }
    if (!approval.targetOrgId || approval.targetOrgId !== input.targetOrgId) {
        throw new ValidationError('Break-glass approval target tenant mismatch.');
    }
    if (!approval.action || approval.action !== input.action) {
        throw new ValidationError('Break-glass approval action mismatch.');
    }
    if (!approval.resourceId || approval.resourceId !== input.resourceId) {
        throw new ValidationError('Break-glass approval resource mismatch.');
    }
    if (approval.dataResidency !== input.authorization.dataResidency ||
        approval.dataClassification !== input.authorization.dataClassification) {
        throw new ValidationError('Break-glass approval is outside current data scope.');
    }
    if (new Date(approval.expiresAt) <= now) {
        throw new ValidationError('Break-glass approval has expired.');
    }

    if (input.consume) {
        const consumed = {
            ...approval,
            status: 'CONSUMED' as const,
            consumedAt: now.toISOString(),
            consumedBy: input.authorization.userId,
        };

        await repository.updateApproval(input.authorization, consumed);

        await recordAuditEvent({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            eventType: 'AUTH',
            action: 'break_glass.consumed',
            resource: 'breakGlassApproval',
            resourceId: approval.id,
            payload: {
                scope: approval.scope,
                targetOrgId: approval.targetOrgId,
                action: approval.action,
                resourceId: approval.resourceId,
            },
            residencyZone: input.authorization.dataResidency,
            classification: input.authorization.dataClassification,
            auditSource: input.authorization.auditSource,
            auditBatchId: input.authorization.auditBatchId,
        });
    }
}
