import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ImpersonationRequest, ImpersonationSession } from '@/server/types/platform/impersonation';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListImpersonationInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListImpersonationDependencies {
    impersonationRepository: IImpersonationRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function listImpersonationRequests(
    deps: ListImpersonationDependencies,
    input: ListImpersonationInput,
): Promise<ImpersonationRequest[]> {
    enforcePermission(input.authorization, 'platformImpersonation', 'read');
    const requests = await deps.impersonationRepository.listRequests(input.authorization);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        requests,
        (request) => request.targetOrgId,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.impersonation.requests.list',
        resource: 'platformImpersonationRequest',
        payload: { count: scoped.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}

export async function listImpersonationSessions(
    deps: ListImpersonationDependencies,
    input: ListImpersonationInput,
): Promise<ImpersonationSession[]> {
    enforcePermission(input.authorization, 'platformImpersonation', 'read');
    const sessions = await deps.impersonationRepository.listSessions(input.authorization);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        sessions,
        (session) => session.targetOrgId,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.impersonation.sessions.list',
        resource: 'platformImpersonationSession',
        payload: { count: scoped.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}
