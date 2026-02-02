import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import { enforcePermission } from '@/server/repositories/security';
import { parseBreakGlassRequest, type BreakGlassRequestInput } from '@/server/validators/platform/admin/break-glass-validators';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';

export interface RequestBreakGlassInput {
    authorization: RepositoryAuthorizationContext;
    request: BreakGlassRequestInput;
}

export interface RequestBreakGlassDependencies {
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface RequestBreakGlassResult {
    approval: BreakGlassApproval;
}

export async function requestBreakGlassApproval(
    deps: RequestBreakGlassDependencies,
    input: RequestBreakGlassInput,
): Promise<RequestBreakGlassResult> {
    enforcePermission(input.authorization, 'platformBreakGlass', 'request');
    const request = parseBreakGlassRequest(input.request);

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: `break-glass.request:${request.scope}`,
        }),
        10 * 60 * 1000,
        6,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for break-glass requests.');
    }

    if (request.targetOrgId !== input.authorization.orgId) {
        await requireTenantInScope(
            deps.tenantRepository,
            input.authorization,
            request.targetOrgId,
            'Target tenant not found or not within allowed scope for break-glass.',
        );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.expiresInMinutes * 60 * 1000);

    const approval: BreakGlassApproval = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        requestedBy: input.authorization.userId,
        approvedBy: null,
        reason: request.reason,
        scope: request.scope,
        status: 'PENDING',
        targetOrgId: request.targetOrgId,
        action: request.action,
        resourceId: request.resourceId,
        createdAt: now.toISOString(),
        approvedAt: null,
        expiresAt: expiresAt.toISOString(),
        consumedAt: null,
        consumedBy: null,
    };

    await deps.breakGlassRepository.createApproval(input.authorization, approval);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'AUTH',
        action: 'break_glass.requested',
        resource: 'breakGlassApproval',
        resourceId: approval.id,
        payload: {
            scope: approval.scope,
            reason: approval.reason,
            targetOrgId: approval.targetOrgId,
            action: approval.action,
            resourceId: approval.resourceId,
        },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return { approval };
}
