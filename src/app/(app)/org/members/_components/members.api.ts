import { queryOptions } from '@tanstack/react-query';
import type { MembershipStatus } from '@prisma/client';
import type { UserData } from '@/server/types/leave-types';

export const memberKeys = {
  list: (orgId: string, params: string) => ['org', orgId, 'members', params] as const,
} as const;

export interface MembersResponse {
  users: UserData[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function isMembersResponse(value: unknown): value is MembersResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<MembersResponse>;
  return Array.isArray(candidate.users)
    && typeof candidate.totalCount === 'number'
    && typeof candidate.page === 'number'
    && typeof candidate.pageSize === 'number';
}

export function listMembersQuery(orgId: string, searchParams: URLSearchParams) {
  const key = membersSearchKey(searchParams);
  return queryOptions({
    queryKey: memberKeys.list(orgId, key),
    queryFn: async (): Promise<MembersResponse> => {
      const url = `/api/org/${orgId}/members?${key}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load members');
      }
      const data: unknown = await res.json();
      if (!isMembersResponse(data)) {
        throw new Error('Invalid members response');
      }
      return data;
    },
    staleTime: 30_000,
  });
}

export async function updateMember(
  orgId: string,
  userId: string,
  body: { roles?: string[]; status?: MembershipStatus },
): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/membership/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Failed to update member');
  }
}
export function membersSearchKey(params: URLSearchParams): string {
  const entries = Array.from(params.entries());
  entries.sort((left, right) => (left[0] === right[0] ? left[1].localeCompare(right[1]) : left[0].localeCompare(right[0])));
  const normalized = new URLSearchParams();
  for (const [key, value] of entries) {
    normalized.append(key, value);
  }
  return normalized.toString();
}
