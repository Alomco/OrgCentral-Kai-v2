import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { ISecurityEventRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import { PrismaEnhancedSecurityEventRepository } from '@/server/repositories/prisma/security/prisma-enhanced-security-event-repository';

export interface EnhancedSecurityEventRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createEnhancedSecurityEventRepository(
    options?: EnhancedSecurityEventRepositoryOptions,
): ISecurityEventRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: BasePrismaRepositoryOptions = {
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return new PrismaEnhancedSecurityEventRepository(repoOptions);
}
