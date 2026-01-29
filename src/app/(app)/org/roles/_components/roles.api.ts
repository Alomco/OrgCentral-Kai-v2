import { queryOptions } from '@tanstack/react-query';
import type { Role } from '@/server/types/hr-types';

export const roleKeys = {
  list: (orgId: string) => ['org', orgId, 'roles'] as const,
  detail: (orgId: string, roleId: string) => ['org', orgId, 'roles', roleId] as const,
} as const;

interface RolesListResponse {
  roles: Role[];
}

function isRolesListResponse(value: unknown): value is RolesListResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { roles?: unknown };
  return Array.isArray(candidate.roles);
}

export function listRolesQuery(orgId: string) {
  return queryOptions({
    queryKey: roleKeys.list(orgId),
    queryFn: async (): Promise<Role[]> => {
      const res = await fetch(`/api/org/${orgId}/roles`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load roles');
      }
      const data: unknown = await res.json();
      if (!isRolesListResponse(data)) {
        throw new Error('Invalid roles response');
      }
      return data.roles;
    },
    staleTime: 30_000,
  });
}

export async function createRole(
  orgId: string,
  body: { name: string; description?: string | null },
): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Failed to create role');
  }
}

export async function updateRole(
  orgId: string,
  roleId: string,
  body: { name?: string; description?: string | null; permissions?: Record<string, string[]> },
): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Failed to update role');
  }
}

export async function deleteRole(orgId: string, roleId: string): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/roles/${roleId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete role');
  }
}