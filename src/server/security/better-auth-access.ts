import { createAccessControl } from 'better-auth/plugins/access';
import type { OrgPermissionMap, OrgRoleKey } from './access-control';
import { ROLE_PERMISSION_STATEMENTS, ROLE_TEMPLATES } from './role-templates';

export const orgAccessControl = createAccessControl(ROLE_PERMISSION_STATEMENTS);

function toMutablePermissions(permissions: OrgPermissionMap): Record<string, string[]> {
    return Object.entries(permissions).reduce<Record<string, string[]>>((accumulator, [resource, actions]) => {
        if (!actions) {
            return accumulator;
        }
        accumulator[resource] = Array.from(actions);
        return accumulator;
    }, {});
}

export const orgRoles = (Object.keys(ROLE_TEMPLATES) as OrgRoleKey[]).reduce(
    (accumulator, roleKey) => {
        accumulator[roleKey] = orgAccessControl.newRole(toMutablePermissions(ROLE_TEMPLATES[roleKey].permissions));
        return accumulator;
    },
    {} as Record<OrgRoleKey, ReturnType<typeof orgAccessControl.newRole>>,
);
