import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getRoleService } from '@/server/services/org';
import { getUserService, type UserServiceContract } from '@/server/services/org/users/user-service.provider';
import { resolveAllowedInviteRoles } from '@/server/services/org/membership/membership-service.policy';
import { assertOnboardingInviteSender } from '@/server/security/authorization/hr-guards/onboarding';
import { MembersListClient } from './_components/members-list.client';
import { OnboardingWizardPanel } from '../../hr/onboarding/_components/onboarding-wizard-panel';
import { OrgInvitationsPanel } from './_components/org-invitations-panel';
import { parseOrgMembersQuery, buildOrgMembersSearchParams, type OrgMembersSearchParams } from './_components/org-members-helpers';
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

export default async function OrgMembersPage({
    searchParams,
}: {
    searchParams?: Promise<OrgMembersSearchParams>;
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
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const query = parseOrgMembersQuery(resolvedSearchParams);
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
    const roleOptions = roles.map((role) => ({
        name: role.name,
        description: role.description ?? null,
    }));
    const allowedRoleNames = resolveAllowedInviteRoles(
        authorization,
        roleOptions.map((role) => role.name),
    );
    const allowedRoleOptions = roleOptions.filter((role) => allowedRoleNames.includes(role.name));
    const defaultRole = allowedRoleOptions[0]?.name ?? 'member';
    const filterRoleNames = roleNames.length > 0 ? roleNames : ['member'];
    let canManageOnboarding = false;
    try {
        await assertOnboardingInviteSender({ authorization });
        canManageOnboarding = true;
    } catch {
        canManageOnboarding = false;
    }
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
    const rangeStart = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
    const rangeEnd = totalCount > 0 ? Math.min(page * pageSize, totalCount) : 0;

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[oklch(var(--muted-foreground))]">Members</p>
                <h1 className="text-2xl font-semibold text-[oklch(var(--foreground))]">Organization members</h1>
                <p className="text-sm text-[oklch(var(--muted-foreground))]">Users with access to this organization.</p>
            </div>

            <OnboardingWizardPanel
                roleOptions={
                    allowedRoleOptions.length > 0
                        ? allowedRoleOptions
                        : [{ name: 'member', description: 'Standard employee access.' }]
                }
                defaultRole={defaultRole}
                canManageOnboarding={canManageOnboarding}
            />

            <OrgInvitationsPanel authorization={authorization} />

            <div className="rounded-2xl bg-[oklch(var(--card)/0.6)] p-6 backdrop-blur">
                <OrgMembersFilters query={query} roleNames={filterRoleNames} />
                <div className="mt-2">
                    <a
                        href={"/api/org/" + authorization.orgId + "/members/export?" + buildOrgMembersSearchParams(query).toString()}
                        className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
                        aria-label="Export filtered members as CSV"
                    >
                        Export CSV
                    </a>
                </div>
                <OrgMembersBulkActions orgId={authorization.orgId} currentQueryKey={buildOrgMembersSearchParams(query).toString()} roleNames={filterRoleNames} />
                <MembersListClient orgId={authorization.orgId} currentQueryKey={buildOrgMembersSearchParams(query).toString()} initial={{ users, totalCount, page, pageSize }} /><div className="mt-4">
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





