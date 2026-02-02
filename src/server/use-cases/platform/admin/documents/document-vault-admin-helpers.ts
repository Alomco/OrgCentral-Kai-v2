import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';

export function buildTenantScopedAuthorization(
    authorization: RepositoryAuthorizationContext,
    tenant: Pick<PlatformTenantDetail, 'id' | 'dataResidency' | 'dataClassification'>,
    auditSource: string,
): RepositoryAuthorizationContext {
    return {
        ...authorization,
        orgId: tenant.id,
        dataResidency: tenant.dataResidency,
        dataClassification: tenant.dataClassification,
        auditSource,
        tenantScope: {
            ...authorization.tenantScope,
            orgId: tenant.id,
            dataResidency: tenant.dataResidency,
            dataClassification: tenant.dataClassification,
            auditSource,
        },
    };
}
