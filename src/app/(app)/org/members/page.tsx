import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getRoleService } from '@/server/services/org';
import { getUserService, type UserServiceContract } from '@/server/services/org/users/user-service.provider';
import { MemberActions } from './_components/member-actions';
import { InviteMemberForm } from './_components/invite-member-form';
import { OrgInvitationsPanel } from './_components/org-invitations-panel';
import {
    parseOrgMembersQuery,
    type OrgMembersSearchParams,
} from './_components/org-members-helpers';
import { OrgMembersPagination } from './_components/org-members-pagination';
import { OrgMembersFilters } from './_components/org-members-filters';
import { OrgMembersBulkActions } from './_components/org-members-bulk-actions';

const membershipStatusSchema = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']);

const membershipSchema = z
    .object({
        organizationId: z.string().trim().min(1),
        roles: z.array(z.string()),
        status: membershipStatusSchema.optional(),
    })
    .loose();

const orgUserSchema = z
    .object({
        id: z.string().trim().min(1),
        email: z.string().trim().min(1),
        displayName: z.string(),
        roles: z.array(z.string()),
        memberships: z.array(membershipSchema),
    })
    .loose();

type OrgUser = z.infer<typeof orgUserSchema>;

export default async function OrgMembersPage({
    searchParams,
}: {
    searchParams?: OrgMembersSearchParams;
}) {
    noStore();

    const headerStore = await headers();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-members',
        },
    );

    const userService: UserServiceContract = getUserService();
    const query = parseOrgMembersQuery(searchParams ?? {});
    const filters = {
        search: query.search.length > 0 ? query.search : undefined,
        status: query.status,
        role: query.role,
    };
    const sort = { key: query.sort, direction: query.direction };
    const { users: rawUsers, totalCount, page, pageSize } =
        await userService.listUsersInOrganizationPaged({
            authorization,
            page: query.page,
            pageSize: query.pageSize,
            filters,
            sort,
        });
    const users = z.array(orgUserSchema).parse(rawUsers);
    const roles = await getRoleService().listRoles({ authorization });
    const roleNames = roles.map((role) => role.name);
    const roleOptions = roleNames.length > 0 ? roleNames : ['member'];
    const allowedRoles = resolveInviteRoles(authorization.roleKey, roleOptions);
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
    const rangeStart = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
    const rangeEnd = totalCount > 0 ? Math.min(page * pageSize, totalCount) : 0;

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Members</p>
                <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Organization members</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Users with access to this organization.</p>
            </div>

            <InviteMemberForm roles={allowedRoles} />

            <OrgInvitationsPanel authorization={authorization} />

            <div className="rounded-2xl bg-[hsl(var(--card)/0.6)] p-6 backdrop-blur">
                <OrgMembersFilters query={query} roleNames={roleOptions} />
                <OrgMembersBulkActions roleNames={roleOptions} />
                <div className="mt-4 grid gap-3">
                    {users.length === 0 ? (
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">No users found.</p>
                    ) : (
                        users.map((user) => {
                            const displayLabel = user.displayName.trim().length > 0 ? user.displayName : user.email;
                            const membership = resolveMembershipForOrg(user, authorization.orgId);
                            const status = membership?.status ?? 'INVITED';
                            const initialRoles = resolveUserRolesForOrg(user, authorization.orgId).join(', ');

                            return (
                                <div
                                    key={user.id}
                                    className="flex flex-col gap-2 rounded-xl bg-[hsl(var(--muted)/0.35)] p-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="userIds"
                                            value={user.id}
                                            form="bulk-members-form"
                                            aria-label={`Select ${displayLabel}`}
                                            data-bulk-member="select"
                                            className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                                {displayLabel}
                                            </p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                                        </div>
                                    </div>

                                    <MemberActions userId={user.id} initialRoles={initialRoles} status={status} />
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="mt-4">
                    <OrgMembersPagination
                        query={{ ...query, page, pageSize }}
                        totalCount={totalCount}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        pageCount={pageCount}
                    />
                </div>
            </div>
        </div>
    );
}

function resolveUserRolesForOrg(
    user: Pick<OrgUser, 'memberships' | 'roles'>,
    orgId: string,
): string[] {
    const membership = user.memberships.find((candidate) => candidate.organizationId === orgId);
    if (membership) {
        return membership.roles;
    }

    return user.roles;
}

function resolveMembershipForOrg(
    user: Pick<OrgUser, 'memberships'>,
    orgId: string,
): z.infer<typeof membershipSchema> | undefined {
    return user.memberships.find((candidate) => candidate.organizationId === orgId);
}

function resolveInviteRoles(roleKey: string, roleNames: string[]): string[] {
    const existing = roleNames.length > 0 ? roleNames : ['member'];
    const merged = new Set(existing);

    if (roleKey === 'globalAdmin' || roleKey === 'owner') {
        merged.add('orgAdmin');
        return Array.from(merged).filter((role) => role === 'orgAdmin');
    }

    if (roleKey === 'orgAdmin') {
        merged.add('hrAdmin');
        return Array.from(merged).filter((role) => role === 'hrAdmin');
    }

    if (roleKey === 'hrAdmin') {
        merged.add('member');
        return Array.from(merged).filter((role) => role === 'member');
    }

    return ['member'];
}
