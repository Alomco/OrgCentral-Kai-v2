import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';

export interface GetPermissionResourceDependencies {
    permissionRepository: IPermissionResourceRepository;
}

export interface GetPermissionResourceInput {
    authorization: RepositoryAuthorizationContext;
    resourceId: string;
}

export async function getPermissionResource(
    deps: GetPermissionResourceDependencies,
    input: GetPermissionResourceInput,
): Promise<PermissionResource> {
    const resource = await deps.permissionRepository.getResource(input.authorization.orgId, input.resourceId);
    if (!resource) {
        throw new EntityNotFoundError('PermissionResource', { resourceId: input.resourceId });
    }
    return resource;
}
