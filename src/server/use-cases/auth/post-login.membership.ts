import type {
    IPostLoginMembershipRepository,
    PostLoginMembershipRecord,
} from '@/server/repositories/contracts/auth/sessions/post-login-membership-repository-contract';
import { createPostLoginMembershipRepository } from '@/server/repositories/providers/auth/post-login-membership-repository-provider';
import { MembershipStatus } from '@/server/types/prisma';

const DEFAULT_MEMBERSHIP_DATE = new Date(0);

export interface MembershipLookupRecord {
    orgId: string;
    status: MembershipStatus;
    activatedAt: Date | null;
    invitedAt: Date | null;
}

type PostLoginMembershipRepositoryContract = Pick<
    IPostLoginMembershipRepository,
    'listMembershipsForUser'
>;

export function resolveMembershipRepository(
    repository?: PostLoginMembershipRepositoryContract,
): PostLoginMembershipRepositoryContract {
    return repository ?? createPostLoginMembershipRepository();
}

export async function listMembershipsForUser(
    repository: PostLoginMembershipRepositoryContract,
    userId: string,
    orgSlug?: string,
): Promise<MembershipLookupRecord[]> {
    const memberships = await repository.listMembershipsForUser(userId, orgSlug);
    return memberships.map((membership: PostLoginMembershipRecord) => ({
        orgId: membership.orgId,
        status: membership.status,
        activatedAt: membership.activatedAt,
        invitedAt: membership.invitedAt,
    }));
}

export function hasInactiveMembership(memberships: MembershipLookupRecord[]): boolean {
    return memberships.some((membership) =>
        membership.status === MembershipStatus.SUSPENDED
        || membership.status === MembershipStatus.DEACTIVATED,
    );
}

export function selectLatestActiveMembershipOrgId(
    memberships: MembershipLookupRecord[],
): string | null {
    const activeMemberships = memberships.filter((membership) => membership.status === MembershipStatus.ACTIVE);
    if (activeMemberships.length === 0) { return null; }

    let latest = activeMemberships[0];
    let latestTimestamp = resolveMembershipTimestamp(latest);

    for (const membership of activeMemberships.slice(1)) {
        const timestamp = resolveMembershipTimestamp(membership);
        if (timestamp > latestTimestamp) {
            latest = membership;
            latestTimestamp = timestamp;
        }
    }
    return latest.orgId;
}

function resolveMembershipTimestamp(membership: MembershipLookupRecord): number {
    return (membership.activatedAt ?? membership.invitedAt ?? DEFAULT_MEMBERSHIP_DATE).getTime();
}
