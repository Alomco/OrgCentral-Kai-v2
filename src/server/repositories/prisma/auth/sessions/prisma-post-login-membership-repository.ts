import type {
    IPostLoginMembershipRepository,
    PostLoginMembershipRecord,
} from '@/server/repositories/contracts/auth/sessions/post-login-membership-repository-contract';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';

export class PrismaPostLoginMembershipRepository
    extends BasePrismaRepository
    implements IPostLoginMembershipRepository {
    constructor(options: BasePrismaRepositoryOptions = {}) {
        super(options);
    }

    async listMembershipsForUser(userId: string, orgSlug?: string): Promise<PostLoginMembershipRecord[]> {
        return this.prisma.membership.findMany({
            where: {
                userId,
                org: orgSlug ? { slug: orgSlug } : undefined,
            },
            select: {
                orgId: true,
                status: true,
                activatedAt: true,
                invitedAt: true,
            },
        });
    }
}
