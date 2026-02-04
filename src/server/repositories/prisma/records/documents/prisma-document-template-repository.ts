import { Prisma, type PrismaClient, type DocumentTemplate as PrismaDocumentTemplate } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    DocumentTemplateListFilters,
    IDocumentTemplateRepository,
} from '@/server/repositories/contracts/records/document-template-repository-contract';
import type {
    DocumentTemplateCreateInput,
    DocumentTemplateUpdateInput,
    DocumentTemplateRecord,
} from '@/server/types/records/document-templates';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapDocumentTemplateRecordToDomain } from '@/server/repositories/mappers/records/document-template-mapper';

export class PrismaDocumentTemplateRepository extends BasePrismaRepository implements IDocumentTemplateRepository {
    private get templates(): PrismaClient['documentTemplate'] {
        return this.prisma.documentTemplate;
    }

    private async ensureOrg(templateId: string, orgId: string): Promise<PrismaDocumentTemplate> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Document template not found for this organization.');
        }
        return record;
    }

    async createTemplate(input: DocumentTemplateCreateInput): Promise<DocumentTemplateRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const templateSchema = toPrismaInputJson(input.templateSchema);
        const record = await this.templates.create({
            data: {
                orgId: input.orgId,
                name: input.name,
                type: input.type,
                templateBody: input.templateBody,
                templateSchema: templateSchema ?? Prisma.JsonNull,
                version: input.version ?? 1,
                isActive: input.isActive ?? true,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
            },
        });
        return mapDocumentTemplateRecordToDomain(record);
    }

    async updateTemplate(
        orgId: string,
        templateId: string,
        updates: DocumentTemplateUpdateInput,
    ): Promise<DocumentTemplateRecord> {
        await this.ensureOrg(templateId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const templateSchema = updates.templateSchema !== undefined ? toPrismaInputJson(updates.templateSchema) : undefined;
        const record = await this.templates.update({
            where: { id: templateId },
            data: {
                name: updates.name ?? undefined,
                type: updates.type ?? undefined,
                templateBody: updates.templateBody ?? undefined,
                templateSchema: templateSchema ?? undefined,
                version: updates.version ?? undefined,
                isActive: updates.isActive ?? undefined,
                metadata: metadata ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapDocumentTemplateRecordToDomain(record);
    }

    async getTemplate(orgId: string, templateId: string): Promise<DocumentTemplateRecord | null> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Document template access denied for this organization.');
        }
        return mapDocumentTemplateRecordToDomain(record);
    }

    async listTemplates(orgId: string, filters?: DocumentTemplateListFilters): Promise<DocumentTemplateRecord[]> {
        const recordList = await this.templates.findMany({
            where: {
                orgId,
                type: filters?.type,
                isActive: filters?.isActive,
            },
            orderBy: { createdAt: 'desc' },
        });
        return recordList.map(mapDocumentTemplateRecordToDomain);
    }
}
