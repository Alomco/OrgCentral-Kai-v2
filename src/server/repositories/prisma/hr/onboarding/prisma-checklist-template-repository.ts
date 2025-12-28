import { Prisma, type PrismaClient, type ChecklistTemplate as PrismaChecklistTemplate } from '@prisma/client';
import type {
    ChecklistTemplateCreateInput,
    ChecklistTemplateUpdateInput,
    IChecklistTemplateRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import {
    mapChecklistTemplateInputToRecord,
    mapChecklistTemplateRecordToDomain,
} from '@/server/repositories/mappers/hr/onboarding/checklist-template-mapper';
import { stampCreate, stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES } from '@/server/repositories/cache-scopes';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

type ChecklistTemplateRecord = PrismaChecklistTemplate;
type ChecklistTemplateCreateData = Prisma.ChecklistTemplateUncheckedCreateInput;
type ChecklistTemplateUpdateData = Prisma.ChecklistTemplateUncheckedUpdateInput;
export class PrismaChecklistTemplateRepository
    extends BasePrismaRepository
    implements IChecklistTemplateRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private get templates(): PrismaClient['checklistTemplate'] {
        return this.prisma.checklistTemplate;
    }

    private async ensureTemplateOrg(templateId: string, orgId: string): Promise<ChecklistTemplateRecord> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Checklist template not found for this organization.');
        }
        return record;
    }

    async createTemplate(input: ChecklistTemplateCreateInput): Promise<ChecklistTemplate> {
        const mapped = mapChecklistTemplateInputToRecord(input);
        const data: ChecklistTemplateCreateData = stampCreate({
            orgId: input.orgId,
            name: input.name,
            type: input.type,
            items: toPrismaInputJson(mapped.items as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull,
        });
        const record = await this.templates.create({
            data,
        });
        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            PrismaChecklistTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistTemplateRecordToDomain(record);
    }

    async updateTemplate(
        orgId: string,
        templateId: string,
        updates: ChecklistTemplateUpdateInput,
    ): Promise<ChecklistTemplate> {
        await this.ensureTemplateOrg(templateId, orgId);
        const mapped = mapChecklistTemplateInputToRecord(updates);
        const data: ChecklistTemplateUpdateData = stampUpdate({
            ...mapped,
            items:
                mapped.items !== undefined
                    ? toPrismaInputJson(mapped.items as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull
                    : undefined,
            orgId,
        });
        const record = await this.templates.update({
            where: { id: templateId },
            data,
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            PrismaChecklistTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistTemplateRecordToDomain(record);
    }

    async deleteTemplate(orgId: string, templateId: string): Promise<void> {
        await this.ensureTemplateOrg(templateId, orgId);
        await this.templates.delete({ where: { id: templateId } });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            PrismaChecklistTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistTemplateRepository.DEFAULT_RESIDENCY,
        );
    }

    async getTemplate(orgId: string, templateId: string): Promise<ChecklistTemplate | null> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Checklist template access denied for this organization.');
        }
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            PrismaChecklistTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistTemplateRecordToDomain(record);
    }

    async listTemplates(orgId: string): Promise<ChecklistTemplate[]> {
        const records = await this.templates.findMany({ where: { orgId } });
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            PrismaChecklistTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistTemplateRepository.DEFAULT_RESIDENCY,
        );
        return records.map(mapChecklistTemplateRecordToDomain);
    }
}
