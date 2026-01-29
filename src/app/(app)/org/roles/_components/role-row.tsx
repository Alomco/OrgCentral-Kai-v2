import type { Role } from '@/server/types/hr-types';
import { RoleEditor } from './role-editor';

export interface OrgRoleRow {
    id: string;
    name: string;
    description?: string | null;
    permissions: Role['permissions'];
}

export function RoleRow({ orgId, role }: { orgId: string; role: OrgRoleRow }) {
    const permissionsText = serializePermissionsToText(role.permissions);

    return (
        <div className="rounded-xl bg-muted/35 p-3">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">{role.name}</p>
                <p className="text-xs text-muted-foreground">{role.description ?? 'No description'}</p>
            </div>

            <RoleEditor
                orgId={orgId}
                roleId={role.id}
                initialName={role.name}
                initialDescription={role.description ?? ''}
                initialPermissionsText={permissionsText}
            />
        </div>
    );
}

function serializePermissionsToText(permissions: Role['permissions']): string {
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
        return '';
    }

    const entries = Object.entries(permissions);
    const lines: string[] = [];

    for (const [resource, value] of entries) {
        if (!resource) {
            continue;
        }

        if (!Array.isArray(value)) {
            continue;
        }

        const permissionsList = value
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim());

        if (permissionsList.length === 0) {
            continue;
        }

        lines.push(`${resource}: ${permissionsList.join(',')}`);
    }

    return lines.join('\n');
}

