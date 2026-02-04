import { Prisma, type PrismaClient, type EmailSequenceTemplate as PrismaEmailSequenceTemplate } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    EmailSequenceTemplateListFilters,
    IEmailSequenceTemplateRepository,
} from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type {
    EmailSequenceTemplateCreateInput,
    EmailSequenceTemplateUpdateInput,
    EmailSequenceTemplateRecord,
} from '@/server/types/hr/onboarding-email-sequences';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapEmailSequenceTemplateRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/email-sequence-mapper';

export class PrismaEmailSequenceTemplateRepository extends BasePrismaRepository implements IEmailSequenceTemplateRepository {
    private get templates(): PrismaClient['emailSequenceTemplate'] {
        return this.prisma.emailSequenceTemplate;
    }

    private async ensureOrg(templateId: string, orgId: string): Promise<PrismaEmailSequenceTemplate> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Email sequence template not found for this organization.');
        }
        return record;
    }

    async createTemplate(input: EmailSequenceTemplateCreateInput): Promise<EmailSequenceTemplateRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const steps = toPrismaInputJson(input.steps);
        const record = await this.templates.create({
            data: {
                orgId: input.orgId,
                name: input.name,
                description: input.description ?? null,
                trigger: input.trigger,
                isActive: input.isActive ?? true,
                steps: steps ?? Prisma.JsonNull,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapEmailSequenceTemplateRecordToDomain(record);
    }

    async updateTemplate(
        orgId: string,
        templateId: string,
        updates: EmailSequenceTemplateUpdateInput,
    ): Promise<EmailSequenceTemplateRecord> {
        await this.ensureOrg(templateId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const steps = updates.steps !== undefined ? toPrismaInputJson(updates.steps) : undefined;
        const record = await this.templates.update({
            where: { id: templateId },
            data: {
                name: updates.name ?? undefined,
                description: updates.description ?? undefined,
                trigger: updates.trigger ?? undefined,
                isActive: updates.isActive ?? undefined,
                steps: steps ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapEmailSequenceTemplateRecordToDomain(record);
    }

    async getTemplate(orgId: string, templateId: string): Promise<EmailSequenceTemplateRecord | null> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Email sequence template access denied for this organization.');
        }
        return mapEmailSequenceTemplateRecordToDomain(record);
    }

    async listTemplates(orgId: string, filters?: EmailSequenceTemplateListFilters): Promise<EmailSequenceTemplateRecord[]> {
        const recordList = await this.templates.findMany({
            where: {
                orgId,
                trigger: filters?.trigger,
                isActive: filters?.isActive,
            },
            orderBy: { createdAt: 'desc' },
        });
        return recordList.map(mapEmailSequenceTemplateRecordToDomain);
    }
}
