import { Prisma, type PrismaClient, type OnboardingWorkflowTemplate as PrismaWorkflowTemplate } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IOnboardingWorkflowTemplateRepository,
    WorkflowTemplateListFilters,
} from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type {
    OnboardingWorkflowTemplateCreateInput,
    OnboardingWorkflowTemplateUpdateInput,
    OnboardingWorkflowTemplateRecord,
} from '@/server/types/hr/onboarding-workflow-templates';
import type { JsonValue } from '@/server/types/json';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapWorkflowTemplateRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/workflow-template-mapper';

export class PrismaOnboardingWorkflowTemplateRepository
    extends BasePrismaRepository
    implements IOnboardingWorkflowTemplateRepository {
    private get templates(): PrismaClient['onboardingWorkflowTemplate'] {
        return this.prisma.onboardingWorkflowTemplate;
    }

    private normalizeRequiredJson(value: JsonValue): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
        if (value === null) {
            return Prisma.JsonNull;
        }
        return value as Prisma.InputJsonValue;
    }

    private async ensureOrg(templateId: string, orgId: string): Promise<PrismaWorkflowTemplate> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Workflow template not found for this organization.');
        }
        return record;
    }

    async createTemplate(input: OnboardingWorkflowTemplateCreateInput): Promise<OnboardingWorkflowTemplateRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const definition = this.normalizeRequiredJson(input.definition);
        const record = await this.templates.create({
            data: {
                orgId: input.orgId,
                name: input.name,
                description: input.description ?? null,
                templateType: input.templateType,
                version: input.version ?? 1,
                isActive: input.isActive ?? true,
                definition,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapWorkflowTemplateRecordToDomain(record);
    }

    async updateTemplate(
        orgId: string,
        templateId: string,
        updates: OnboardingWorkflowTemplateUpdateInput,
    ): Promise<OnboardingWorkflowTemplateRecord> {
        await this.ensureOrg(templateId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const definition = updates.definition !== undefined ? this.normalizeRequiredJson(updates.definition) : undefined;
        const record = await this.templates.update({
            where: { id: templateId },
            data: {
                name: updates.name ?? undefined,
                description: updates.description ?? undefined,
                templateType: updates.templateType ?? undefined,
                version: updates.version ?? undefined,
                isActive: updates.isActive ?? undefined,
                definition: definition ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapWorkflowTemplateRecordToDomain(record);
    }

    async getTemplate(orgId: string, templateId: string): Promise<OnboardingWorkflowTemplateRecord | null> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Workflow template access denied for this organization.');
        }
        return mapWorkflowTemplateRecordToDomain(record);
    }

    async listTemplates(
        orgId: string,
        filters?: WorkflowTemplateListFilters,
    ): Promise<OnboardingWorkflowTemplateRecord[]> {
        const recordList = await this.templates.findMany({
            where: {
                orgId,
                templateType: filters?.templateType,
                isActive: filters?.isActive,
            },
            orderBy: { createdAt: 'desc' },
        });
        return recordList.map(mapWorkflowTemplateRecordToDomain);
    }
}
