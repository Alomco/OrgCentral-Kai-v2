"use client";

import { useQuery } from '@tanstack/react-query';
import type { Role } from '@/server/types/hr-types';
import { listRolesQuery } from './roles.api';
import { RoleRow } from './role-row';

export function RolesListClient({ orgId, initial }: { orgId: string; initial: Role[] }) {
  const { data } = useQuery({ ...listRolesQuery(orgId), initialData: initial });
  const roles = data;

  return roles.length === 0 ? (
    <p className="text-sm text-muted-foreground">No roles found.</p>
  ) : (
    <div className="grid gap-3">
      {roles.map((role) => (
        <RoleRow
          key={role.id}
          orgId={orgId}
          role={{ id: role.id, name: role.name, description: role.description ?? null, permissions: role.permissions }}
        />
      ))}
    </div>
  );
}