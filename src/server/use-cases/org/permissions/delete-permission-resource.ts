import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';
import { CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { invalidateOrgCache } from '@/server/lib/cache-tags';

export interface DeletePermissionResourceDependencies {
    permissionRepository: IPermissionResourceRepository;
}

export interface DeletePermissionResourceInput {
    authorization: RepositoryAuthorizationContext;
    resourceId: string;
}

export async function deletePermissionResource(
    deps: DeletePermissionResourceDependencies,
    input: DeletePermissionResourceInput,
): Promise<PermissionResource> {
    const existing = await deps.permissionRepository.getResource(input.authorization.orgId, input.resourceId);
    if (!existing) {
        throw new EntityNotFoundError('PermissionResource', { resourceId: input.resourceId });
    }

    await deps.permissionRepository.deleteResource(input.authorization.orgId, input.resourceId);

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_PERMISSIONS,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    return existing;
}
