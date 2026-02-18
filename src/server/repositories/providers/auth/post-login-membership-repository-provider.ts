import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { IPostLoginMembershipRepository } from '@/server/repositories/contracts/auth/sessions/post-login-membership-repository-contract';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaPostLoginMembershipRepository } from '@/server/repositories/prisma/auth/sessions/prisma-post-login-membership-repository';

export interface PostLoginMembershipRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createPostLoginMembershipRepository(
    options?: PostLoginMembershipRepositoryOptions,
): IPostLoginMembershipRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;

    return new PrismaPostLoginMembershipRepository({
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    });
}
