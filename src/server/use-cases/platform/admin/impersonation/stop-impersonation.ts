import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ImpersonationSession } from '@/server/types/platform/impersonation';
import { enforcePermission } from '@/server/repositories/security';
import { parseImpersonationStop, type ImpersonationStopInput } from '@/server/validators/platform/admin/impersonation-validators';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';

export interface StopImpersonationInput {
    authorization: RepositoryAuthorizationContext;
    request: ImpersonationStopInput;
}

export interface StopImpersonationDependencies {
    impersonationRepository: IImpersonationRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function stopImpersonationSession(
    deps: StopImpersonationDependencies,
    input: StopImpersonationInput,
): Promise<ImpersonationSession> {
    enforcePermission(input.authorization, 'platformImpersonation', 'stop');

    const request = parseImpersonationStop(input.request);

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'impersonation.stop',
        }),
        10 * 60 * 1000,
        12,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for impersonation sessions.');
    }
    const session = await deps.impersonationRepository.getSession(input.authorization, request.sessionId);

    if (!session) {
        throw new ValidationError('Impersonation session not found.');
    }
    await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        session.targetOrgId,
        'Target tenant not found or not within allowed scope for impersonation.',
    );

    const now = new Date().toISOString();
    const updated: ImpersonationSession = {
        ...session,
        status: 'REVOKED',
        revokedAt: now,
    };

    await deps.impersonationRepository.updateSession(input.authorization, updated);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'AUTH',
        action: 'impersonation.stopped',
        resource: 'platformImpersonationSession',
        resourceId: updated.id,
        payload: { reason: request.reason ?? null },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return updated;
}
