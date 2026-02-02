import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { ValidationError } from '@/server/errors';

export async function requireTenantInScope(
    tenantRepository: IPlatformTenantRepository,
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
    message = 'Tenant not found or not within allowed scope.',
) {
    const tenant = await tenantRepository.getTenantDetail(authorization, tenantId);
    if (!tenant) {
        throw new ValidationError(message);
    }
    return tenant;
}

export async function filterRecordsByTenantScope<TRecord>(
    tenantRepository: IPlatformTenantRepository,
    authorization: RepositoryAuthorizationContext,
    records: TRecord[],
    getTenantId: (record: TRecord) => string | null | undefined,
): Promise<TRecord[]> {
    const cache = new Map<string, boolean>();
    const filtered: TRecord[] = [];

    for (const record of records) {
        const tenantId = getTenantId(record);
        if (!tenantId) {
            filtered.push(record);
            continue;
        }

        let allowed = cache.get(tenantId);
        if (allowed === undefined) {
            const tenant = await tenantRepository.getTenantDetail(authorization, tenantId);
            allowed = Boolean(tenant);
            cache.set(tenantId, allowed);
        }

        if (allowed) {
            filtered.push(record);
        }
    }

    return filtered;
}
