import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBreakGlassRepository, BreakGlassListFilters } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListBreakGlassInput {
    authorization: RepositoryAuthorizationContext;
    filters?: BreakGlassListFilters;
}

export interface ListBreakGlassDependencies {
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function listBreakGlassApprovals(
    deps: ListBreakGlassDependencies,
    input: ListBreakGlassInput,
): Promise<BreakGlassApproval[]> {
    enforcePermission(input.authorization, 'platformBreakGlass', 'read');
    const approvals = await deps.breakGlassRepository.listApprovals(input.authorization, input.filters);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        approvals,
        (approval) => approval.targetOrgId,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.break-glass.list',
        resource: 'breakGlassApproval',
        payload: {
            count: scoped.length,
            scope: input.filters?.scope ?? null,
            status: input.filters?.status ?? null,
        },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}
