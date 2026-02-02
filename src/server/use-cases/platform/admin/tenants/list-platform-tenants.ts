import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantListResult } from '@/server/types/platform/tenant-admin';
import { enforcePermission } from '@/server/repositories/security';
import { parseTenantListQuery, type TenantListQueryInput } from '@/server/validators/platform/admin/tenant-validators';
import { ValidationError } from '@/server/errors';
import { hasPermission } from '@/lib/security/permission-check';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListPlatformTenantsInput {
    authorization: RepositoryAuthorizationContext;
    query: TenantListQueryInput;
}

export interface ListPlatformTenantsDependencies {
    tenantRepository: IPlatformTenantRepository;
}

export async function listPlatformTenants(
    deps: ListPlatformTenantsDependencies,
    input: ListPlatformTenantsInput,
): Promise<PlatformTenantListResult> {
    enforcePermission(input.authorization, 'platformTenants', 'read');

    const query = parseTenantListQuery(input.query);

    const canOverrideResidency = hasPermission(input.authorization.permissions, 'residency', 'enforce');
    const classification = query.classification?.length ? query.classification : [input.authorization.dataClassification];
    const residency = query.residency?.length ? query.residency : [input.authorization.dataResidency];

    if (!canOverrideResidency) {
        if (!classification.includes(input.authorization.dataClassification)) {
            throw new ValidationError('Classification filter is outside allowed scope.');
        }
        if (!residency.includes(input.authorization.dataResidency)) {
            throw new ValidationError('Residency filter is outside allowed scope.');
        }
    }

    const result = await deps.tenantRepository.listTenants(input.authorization, {
        ...query,
        classification,
        residency,
    });

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.tenants.list',
        resource: 'platformTenant',
        payload: {
            count: result.items.length,
            page: result.page,
            pageSize: result.pageSize,
            query: query.query ?? null,
            status: query.status ?? [],
            complianceTier: query.complianceTier ?? [],
            classification,
            residency,
        },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return result;
}
