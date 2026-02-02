import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { PlatformTenantDetail, PlatformTenantStatusAction } from '@/server/types/platform/tenant-admin';
import { enforcePermission } from '@/server/repositories/security';
import { parseTenantStatusAction, type TenantStatusActionInput } from '@/server/validators/platform/admin/tenant-validators';
import { requireBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/require-break-glass';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';
import type { OrganizationStatus } from '@/server/types/prisma';

export interface UpdatePlatformTenantStatusInput {
    authorization: RepositoryAuthorizationContext;
    request: TenantStatusActionInput;
}

export interface UpdatePlatformTenantStatusDependencies {
    tenantRepository: IPlatformTenantRepository;
    breakGlassRepository: IBreakGlassRepository;
}

export async function updatePlatformTenantStatus(
    deps: UpdatePlatformTenantStatusDependencies,
    input: UpdatePlatformTenantStatusInput,
): Promise<PlatformTenantDetail> {
    enforcePermission(input.authorization, 'platformTenants', 'update');

    const request = parseTenantStatusAction(input.request);

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: `tenant-status:${request.action}`,
        }),
        10 * 60 * 1000,
        12,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for tenant status changes.');
    }

    if (request.action === 'SUSPEND' || request.action === 'ARCHIVE') {
        await requireBreakGlassApproval(deps.breakGlassRepository, {
            authorization: input.authorization,
            approvalId: request.breakGlassApprovalId,
            scope: 'tenant-status',
            targetOrgId: request.tenantId,
            action: `tenant.${request.action.toLowerCase()}`,
            resourceId: request.tenantId,
        });
    }

    const status = resolveTenantStatus(request.action);
    const tenant = await deps.tenantRepository.updateTenantStatus(
        input.authorization,
        request.tenantId,
        status,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: `tenant.${request.action.toLowerCase()}`,
        resource: 'platformTenant',
        resourceId: tenant.id,
        payload: { status },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    if (request.action === 'SUSPEND' || request.action === 'ARCHIVE') {
        await requireBreakGlassApproval(deps.breakGlassRepository, {
            authorization: input.authorization,
            approvalId: request.breakGlassApprovalId,
            scope: 'tenant-status',
            targetOrgId: request.tenantId,
            action: `tenant.${request.action.toLowerCase()}`,
            resourceId: request.tenantId,
            consume: true,
        });
    }

    return tenant;
}

function resolveTenantStatus(action: PlatformTenantStatusAction): OrganizationStatus {
    switch (action) {
        case 'SUSPEND':
            return 'SUSPENDED';
        case 'RESTORE':
            return 'ACTIVE';
        case 'ARCHIVE':
            return 'DECOMMISSIONED';
    }
}
