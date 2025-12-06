import { createAccessControl } from 'better-auth/plugins/access';

const STATEMENTS = {
    organization: ['read', 'update', 'governance'],
    member: ['read', 'invite', 'update', 'remove'],
    invitation: ['create', 'cancel'],
    audit: ['read', 'write'],
    cache: ['tag', 'invalidate'],
    residency: ['enforce'],
};

type AccessResource = keyof typeof STATEMENTS;

export const orgAccessControl = createAccessControl(STATEMENTS);

export const orgRoles = {
    owner: orgAccessControl.newRole({
        organization: STATEMENTS.organization,
        member: STATEMENTS.member,
        invitation: STATEMENTS.invitation,
        audit: STATEMENTS.audit,
        cache: STATEMENTS.cache,
        residency: STATEMENTS.residency,
    }),
    orgAdmin: orgAccessControl.newRole({
        organization: ['read', 'update'],
        member: ['read', 'invite', 'update'],
        invitation: STATEMENTS.invitation,
        cache: STATEMENTS.cache,
    }),
    compliance: orgAccessControl.newRole({
        audit: STATEMENTS.audit,
        residency: STATEMENTS.residency,
        organization: ['read'],
    }),
    member: orgAccessControl.newRole({
        organization: ['read'],
    }),
} as const;

export type OrgRoleKey = keyof typeof orgRoles;
export type OrgPermissionMap = Partial<Record<AccessResource, string[]>>;

export function combineRoleStatements(roleKeys: OrgRoleKey[]): OrgPermissionMap {
    return roleKeys.reduce<OrgPermissionMap>((accumulator, key) => {
        const statements = orgRoles[key].statements as Record<AccessResource, string[]>;
        for (const resource of Object.keys(statements) as AccessResource[]) {
            const existing = accumulator[resource] ?? [];
            const merged = new Set([...existing, ...statements[resource]]);
            accumulator[resource] = Array.from(merged);
        }
        return accumulator;
    }, {});
}
