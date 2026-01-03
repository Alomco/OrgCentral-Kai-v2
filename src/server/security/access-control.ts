import type { OrgRoleKey as RoleKey } from './role-constants';

export type OrgPermissionMap = Partial<Record<string, readonly string[]>>;
export type OrgRoleKey = RoleKey;

export { BUILTIN_ROLE_KEYS, isOrgRoleKey } from './role-constants';
