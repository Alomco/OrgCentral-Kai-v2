import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository, PlatformTenantMetrics } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { enforcePermission } from '@/server/repositories/security';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface GetPlatformTenantMetricsInput {
    authorization: RepositoryAuthorizationContext;
}

export interface GetPlatformTenantMetricsDependencies {
    tenantRepository: IPlatformTenantRepository;
}

export async function getPlatformTenantMetrics(
    deps: GetPlatformTenantMetricsDependencies,
    input: GetPlatformTenantMetricsInput,
): Promise<PlatformTenantMetrics> {
    enforcePermission(input.authorization, 'platformTenants', 'read');
    const metrics = await deps.tenantRepository.getTenantMetrics(input.authorization);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.tenants.metrics',
        resource: 'platformTenant',
        payload: { ...metrics },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return metrics;
}
