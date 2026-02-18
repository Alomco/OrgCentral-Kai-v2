import type { MembershipStatus } from '@/server/types/prisma';

export interface PostLoginMembershipRecord {
    orgId: string;
    status: MembershipStatus;
    activatedAt: Date | null;
    invitedAt: Date | null;
}

export interface IPostLoginMembershipRepository {
    listMembershipsForUser(userId: string, orgSlug?: string): Promise<PostLoginMembershipRecord[]>;
}
