import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { PrismaOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type { IDocumentTemplateRepository } from '@/server/repositories/contracts/records/document-template-repository-contract';
import { PrismaDocumentTemplateRepository } from '@/server/repositories/prisma/records/documents';

export interface DocumentTemplateDependencies {
    documentTemplateRepository: IDocumentTemplateRepository;
}

export interface DocumentTemplateDependencyOptions {
    prismaOptions?: PrismaOptions;
    overrides?: Partial<DocumentTemplateDependencies>;
}

export function buildDocumentTemplateDependencies(
    options?: DocumentTemplateDependencyOptions,
): DocumentTemplateDependencies {
    const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma: prismaClient,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    return {
        documentTemplateRepository:
            options?.overrides?.documentTemplateRepository ?? new PrismaDocumentTemplateRepository(repoOptions),
    };
}
