import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { IMembershipRoleSnapshotRepository } from '@/server/repositories/contracts/auth/sessions/membership-role-snapshot-repository-contract';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaMembershipRoleSnapshotRepository } from '@/server/repositories/prisma/auth/sessions/prisma-membership-role-snapshot-repository';

export interface MembershipRoleSnapshotRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createMembershipRoleSnapshotRepository(
    options?: MembershipRoleSnapshotRepositoryOptions,
): IMembershipRoleSnapshotRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;

    return new PrismaMembershipRoleSnapshotRepository({
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    });
}
