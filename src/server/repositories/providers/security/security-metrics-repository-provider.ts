import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { ISecurityMetricsRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import { PrismaSecurityMetricsRepository } from '@/server/repositories/prisma/security/prisma-security-metrics-repository';

export interface SecurityMetricsRepositoryOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function createSecurityMetricsRepository(
    options?: SecurityMetricsRepositoryOptions,
): ISecurityMetricsRepository {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: BasePrismaRepositoryOptions = {
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return new PrismaSecurityMetricsRepository(repoOptions);
}
