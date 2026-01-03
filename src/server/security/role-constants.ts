export const BUILTIN_ROLE_KEYS = [
    'globalAdmin',
    'owner',
    'orgAdmin',
    'hrAdmin',
    'manager',
    'compliance',
    'member',
] as const;

export type OrgRoleKey = typeof BUILTIN_ROLE_KEYS[number];

export const TENANT_ROLE_KEYS = [
    'owner',
    'orgAdmin',
    'hrAdmin',
    'manager',
    'compliance',
    'member',
] as const;

export function isOrgRoleKey(roleName?: string | null): roleName is OrgRoleKey {
    if (!roleName) {
        return false;
    }
    return BUILTIN_ROLE_KEYS.includes(roleName as OrgRoleKey);
}
