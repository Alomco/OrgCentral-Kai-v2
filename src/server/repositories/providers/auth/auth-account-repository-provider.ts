import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { IAuthAccountRepository } from '@/server/repositories/contracts/auth/sessions/auth-account-repository-contract';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaAuthAccountRepository } from '@/server/repositories/prisma/auth/sessions/prisma-auth-account-repository';

export interface AuthAccountRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createAuthAccountRepository(
    options?: AuthAccountRepositoryOptions,
): IAuthAccountRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;

    return new PrismaAuthAccountRepository({
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    });
}
