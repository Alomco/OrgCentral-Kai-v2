import { RoleScope } from '@/server/types/prisma';
import type {
    IMembershipRoleSnapshotRepository,
    MembershipRoleSnapshotRecord,
} from '@/server/repositories/contracts/auth/sessions/membership-role-snapshot-repository-contract';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';

export class PrismaMembershipRoleSnapshotRepository
    extends BasePrismaRepository
    implements IMembershipRoleSnapshotRepository {
    constructor(options: BasePrismaRepositoryOptions = {}) {
        super(options);
    }

    async getMembershipRoleSnapshot(
        orgId: string,
        userId: string,
    ): Promise<MembershipRoleSnapshotRecord | null> {
        const membership = await this.prisma.membership.findUnique({
            where: { orgId_userId: { orgId, userId } },
            select: {
                role: { select: { name: true, scope: true } },
                org: { select: { slug: true } },
            },
        });

        if (!membership) {
            return null;
        }

        return {
            roleName: membership.role?.name ?? 'unknown',
            roleScope: membership.role?.scope ?? RoleScope.ORG,
            orgSlug: membership.org.slug,
        };
    }
}
