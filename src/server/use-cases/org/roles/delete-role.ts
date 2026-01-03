import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { Role } from '@/server/types/hr-types';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ROLES } from '@/server/repositories/cache-scopes';
import { isOrgRoleKey } from '@/server/security/access-control';

export interface DeleteRoleInput {
  authorization: RepositoryAuthorizationContext;
  roleId: string;
}

export interface DeleteRoleDependencies {
  roleRepository: IRoleRepository;
}

export interface DeleteRoleResult {
  success: true;
  role: Role;
}

export async function deleteRole(
  deps: DeleteRoleDependencies,
  input: DeleteRoleInput,
): Promise<DeleteRoleResult> {
  const roleRepository = deps.roleRepository;
  const existing = await roleRepository.getRole(input.authorization.orgId, input.roleId);
  if (!existing) {
    throw new EntityNotFoundError('Role', { roleId: input.roleId });
  }

  if (isReservedRole(existing)) {
    throw new ValidationError('Reserved roles cannot be deleted.');
  }

  await roleRepository.deleteRole(input.authorization.orgId, input.roleId);

  await invalidateOrgCache(
    input.authorization.orgId,
    CACHE_SCOPE_ROLES,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );
  return { success: true, role: existing };
}

function isReservedRole(role: Role): boolean {
  return isOrgRoleKey(role.name);
}
