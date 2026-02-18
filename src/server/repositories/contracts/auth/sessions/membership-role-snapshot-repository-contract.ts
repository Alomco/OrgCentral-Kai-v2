import type { RoleScope } from '@/server/types/prisma';

export interface MembershipRoleSnapshotRecord {
    roleName: string;
    roleScope: RoleScope;
    orgSlug: string;
}

export interface IMembershipRoleSnapshotRepository {
    getMembershipRoleSnapshot(orgId: string, userId: string): Promise<MembershipRoleSnapshotRecord | null>;
}
