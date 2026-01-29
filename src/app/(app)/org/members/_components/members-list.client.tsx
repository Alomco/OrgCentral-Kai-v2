"use client";

import { useQuery } from '@tanstack/react-query';
import type { MembershipStatus } from '@prisma/client';
import { listMembersQuery } from './members.api';
import type { UserData } from '@/server/types/leave-types';
import { MemberActions } from './member-actions';

export function MembersListClient({
  orgId,
  currentQueryKey,
  initial,
}: {
  orgId: string;
  currentQueryKey: string;
  initial: { users: UserData[]; totalCount: number; page: number; pageSize: number };
}) {
  const params = new URLSearchParams(currentQueryKey);
  const { data } = useQuery({ ...listMembersQuery(orgId, params), initialData: initial });
  const users = data.users;

  return (
    <div className="mt-4 grid gap-3">
      {users.length === 0 ? (
        <p className="text-sm text-[oklch(var(--muted-foreground))]">No users found.</p>
      ) : (
        users.map((user) => {
          const displayLabel = user.displayName.trim().length > 0 ? user.displayName : user.email;
          const membership = user.memberships.find((member) => member.organizationId === orgId);
          const status: MembershipStatus = membership?.status ?? 'INVITED';
          const initialRoles = (membership ? membership.roles : user.roles).join(', ');

          return (
            <div key={user.id} className="flex flex-col gap-2 rounded-xl bg-[oklch(var(--muted)/0.35)] p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="userIds"
                  value={user.id}
                  form="bulk-members-form"
                  aria-label={`Select ${displayLabel}`}
                  data-bulk-member="select"
                  className="mt-1 h-4 w-4 rounded border-[oklch(var(--border))] text-[oklch(var(--primary))]"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[oklch(var(--foreground))]">{displayLabel}</p>
                  <p className="text-xs text-[oklch(var(--muted-foreground))]">{user.email}</p>
                </div>
              </div>

              <MemberActions orgId={orgId} userId={user.id} initialRoles={initialRoles} status={status} currentQueryKey={currentQueryKey} />
            </div>
          );
        })
      )}
    </div>
  );
}

