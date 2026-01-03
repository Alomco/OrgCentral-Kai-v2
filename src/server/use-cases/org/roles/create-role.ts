import { RoleScope } from '@prisma/client';
import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { Role } from '@/server/types/hr-types';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ROLES } from '@/server/repositories/cache-scopes';
import { isOrgRoleKey } from '@/server/security/access-control';

export interface CreateRoleInput {
  authorization: RepositoryAuthorizationContext;
  name: string;
  description?: string | null;
  permissions?: Role['permissions'];
  scope?: RoleScope;
  inheritsRoleIds?: string[];
}

export interface CreateRoleDependencies {
  roleRepository: IRoleRepository;
}

export async function createRole(
  deps: CreateRoleDependencies,
  input: CreateRoleInput,
): Promise<Role> {
  const roleRepository = deps.roleRepository;
  const name = input.name.trim();

  if (!name) {
    throw new ValidationError('Role name is required.');
  }
  if (isReservedRole(name)) {
    throw new ValidationError('Reserved role names cannot be created.');
  }

  const existing = await roleRepository.getRoleByName(input.authorization.orgId, name);
  if (existing) {
    throw new ValidationError('A role with this name already exists.');
  }

  await roleRepository.createRole(input.authorization.orgId, {
    orgId: input.authorization.orgId,
    name,
    description: input.description ?? null,
    scope: input.scope ?? RoleScope.ORG,
    permissions: input.permissions ?? {},
    inheritsRoleIds: input.inheritsRoleIds ?? [],
  });

  await invalidateOrgCache(
    input.authorization.orgId,
    CACHE_SCOPE_ROLES,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );

  const created = await roleRepository.getRoleByName(input.authorization.orgId, name);
  if (!created) {
    throw new EntityNotFoundError('Role', { name });
  }

  return created;
}

function isReservedRole(name: string): boolean {
  return isOrgRoleKey(name);
}
