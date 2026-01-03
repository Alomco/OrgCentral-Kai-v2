import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';

export interface ListPermissionResourcesDependencies {
    permissionRepository: IPermissionResourceRepository;
}

export interface ListPermissionResourcesInput {
    authorization: RepositoryAuthorizationContext;
}

export async function listPermissionResources(
    deps: ListPermissionResourcesDependencies,
    input: ListPermissionResourcesInput,
): Promise<PermissionResource[]> {
    return deps.permissionRepository.listResources(input.authorization.orgId);
}
