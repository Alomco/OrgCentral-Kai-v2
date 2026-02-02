import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { PrismaDocumentVaultRepository } from '@/server/repositories/prisma/records/documents/prisma-document-vault-repository';
import { PrismaBreakGlassRepository } from '@/server/repositories/prisma/platform/admin/prisma-break-glass-repository';
import { PrismaPlatformTenantRepository } from '@/server/repositories/prisma/platform/admin/prisma-platform-tenant-repository';

export interface DocumentVaultAdminDependencies {
    documentVaultRepository: IDocumentVaultRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export type DocumentVaultAdminOverrides = Partial<DocumentVaultAdminDependencies>;

export interface DocumentVaultAdminDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: DocumentVaultAdminOverrides;
}

export function buildDocumentVaultAdminDependencies(
    options?: DocumentVaultAdminDependencyOptions,
): DocumentVaultAdminDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: PrismaOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        documentVaultRepository:
            options?.overrides?.documentVaultRepository ?? new PrismaDocumentVaultRepository(repoOptions),
        breakGlassRepository:
            options?.overrides?.breakGlassRepository ?? new PrismaBreakGlassRepository(repoOptions),
        tenantRepository:
            options?.overrides?.tenantRepository ?? new PrismaPlatformTenantRepository(repoOptions),
    };
}
