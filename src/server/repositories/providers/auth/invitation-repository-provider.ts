import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';

export interface InvitationRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createInvitationRepository(
    options?: InvitationRepositoryOptions,
): IInvitationRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return new PrismaInvitationRepository(repoOptions);
}
