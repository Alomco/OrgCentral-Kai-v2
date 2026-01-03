import { RoleScope } from '@prisma/client';
import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { Role } from '@/server/types/hr-types';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ROLES } from '@/server/repositories/cache-scopes';
import { isOrgRoleKey } from '@/server/security/access-control';

export interface UpdateRoleInput {
  authorization: RepositoryAuthorizationContext;
  roleId: string;
  name?: string;
  description?: string | null;
  permissions?: Role['permissions'];
  scope?: RoleScope;
  inheritsRoleIds?: string[];
}

export interface UpdateRoleDependencies {
  roleRepository: IRoleRepository;
}

export async function updateRole(
  deps: UpdateRoleDependencies,
  input: UpdateRoleInput,
): Promise<Role> {
  const roleRepository = deps.roleRepository;
  const existing = await roleRepository.getRole(input.authorization.orgId, input.roleId);
  if (!existing) {
    throw new EntityNotFoundError('Role', { roleId: input.roleId });
  }

  const updates: Partial<Omit<Role, 'id' | 'orgId' | 'createdAt'>> = {};

  if (typeof input.name === 'string') {
    const nextName = await validateRoleNameUpdate(roleRepository, input.authorization, existing, input.name);
    if (nextName) {
      updates.name = nextName;
    }
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.permissions !== undefined) {
    updates.permissions = input.permissions;
  }

  if (input.inheritsRoleIds !== undefined) {
    updates.inheritsRoleIds = input.inheritsRoleIds;
  }

  if (input.scope !== undefined) {
    updates.scope = input.scope ?? RoleScope.ORG;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updates were provided.');
  }

  await roleRepository.updateRole(input.authorization.orgId, input.roleId, updates);

  await invalidateOrgCache(
    input.authorization.orgId,
    CACHE_SCOPE_ROLES,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );

  const updated = await roleRepository.getRole(input.authorization.orgId, input.roleId);
  if (!updated) {
    throw new EntityNotFoundError('Role', { roleId: input.roleId });
  }
  return updated;
}

function isReservedRoleName(roleName: string): boolean {
  return isOrgRoleKey(roleName);
}

async function validateRoleNameUpdate(
  roleRepository: IRoleRepository,
  authorization: RepositoryAuthorizationContext,
  existing: Role,
  inputName: string,
): Promise<string | undefined> {
  const nextName = inputName.trim();
  if (!nextName) {
    throw new ValidationError('Role name cannot be empty.');
  }

  if (existing.name === nextName) {
    return undefined;
  }

  if (isReservedRoleName(existing.name)) {
    throw new ValidationError('Reserved roles cannot be renamed.');
  }

  if (isReservedRoleName(nextName)) {
    throw new ValidationError('Reserved role names cannot be reused.');
  }

  const duplicate = await roleRepository.getRoleByName(authorization.orgId, nextName);
  if (duplicate && duplicate.id !== existing.id) {
    throw new ValidationError('A role with this name already exists.');
  }

  return nextName;
}
