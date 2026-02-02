import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';
import { enforcePermission } from '@/server/repositories/security';
import { EntityNotFoundError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface GetPlatformTenantDetailInput {
    authorization: RepositoryAuthorizationContext;
    tenantId: string;
}

export interface GetPlatformTenantDetailDependencies {
    tenantRepository: IPlatformTenantRepository;
}

export async function getPlatformTenantDetail(
    deps: GetPlatformTenantDetailDependencies,
    input: GetPlatformTenantDetailInput,
): Promise<PlatformTenantDetail> {
    enforcePermission(input.authorization, 'platformTenants', 'read');

    const tenant = await deps.tenantRepository.getTenantDetail(input.authorization, input.tenantId);
    if (!tenant) {
        throw new EntityNotFoundError('Tenant');
    }

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.tenants.detail',
        resource: 'platformTenant',
        resourceId: tenant.id,
        payload: { status: tenant.status },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return tenant;
}
