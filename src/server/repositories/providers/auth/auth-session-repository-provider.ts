import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { IAuthSessionRepository } from '@/server/repositories/contracts/auth/sessions/auth-session-repository-contract';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaAuthSessionRepository } from '@/server/repositories/prisma/auth/sessions/prisma-auth-session-repository';

export interface AuthSessionRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createAuthSessionRepository(
    options?: AuthSessionRepositoryOptions,
): IAuthSessionRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;

    return new PrismaAuthSessionRepository({
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    });
}
