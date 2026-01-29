import { queryOptions } from '@tanstack/react-query';
import type { PermissionResource } from '@/server/types/security-types';

export const permissionKeys = {
  list: (orgId: string) => ['org', orgId, 'permissions', 'resources'] as const,
  detail: (orgId: string, id: string) => ['org', orgId, 'permissions', 'resources', id] as const,
} as const;

interface PermissionResourcesResponse {
  resources: PermissionResource[];
}

function isPermissionResourcesResponse(value: unknown): value is PermissionResourcesResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { resources?: unknown };
  return Array.isArray(candidate.resources);
}

export function listPermissionResourcesQuery(orgId: string) {
  return queryOptions({
    queryKey: permissionKeys.list(orgId),
    queryFn: async (): Promise<PermissionResource[]> => {
      const res = await fetch(`/api/org/${orgId}/permissions`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load permission resources');
      }
      const data: unknown = await res.json();
      if (!isPermissionResourcesResponse(data)) {
        throw new Error('Invalid permission resources response');
      }
      return data.resources;
    },
    staleTime: 30_000,
  });
}

export async function createPermissionResource(
  orgId: string,
  body: { resource: string; actions: string[]; description?: string },
): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Unable to create permission resource');
  }
}

export async function updatePermissionResource(
  orgId: string,
  resourceId: string,
  body: { resource?: string; actions?: string[]; description?: string },
): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/permissions/${resourceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Unable to update permission resource');
  }
}

export async function deletePermissionResource(orgId: string, resourceId: string): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/permissions/${resourceId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Unable to delete permission resource');
  }
}