import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';

import { RoleCreateForm } from './_components/role-create-form';
import { RoleRow } from './_components/role-row';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getRoleService } from '@/server/services/org';

export default async function OrgRolesPage() {
    noStore();

    const headerStore = await headers();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-roles',
        },
    );

    const roles = await getRoleService().listRoles({ authorization });

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Roles</p>
                <h1 className="text-2xl font-semibold text-foreground">Organization roles</h1>
                <p className="text-sm text-muted-foreground">
                    Manage custom roles and permissions for your organization.
                </p>
            </div>

            <RoleCreateForm />

            <div className="rounded-2xl bg-card/60 p-6 backdrop-blur">
                <div className="grid gap-3">
                    {roles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No roles found.</p>
                    ) : (
                        roles.map((role) => (
                            <RoleRow
                                key={role.id}
                                role={{
                                    id: role.id,
                                    name: role.name,
                                    description: role.description ?? null,
                                    permissions: role.permissions,
                                }}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
