import { Prisma, type PrismaClient, type ComplianceTemplate as PrismaComplianceTemplate } from '../../../../../generated/client';
import { z } from 'zod';
import { complianceTemplateItemSchema } from '@/server/validators/hr/compliance/compliance-validators';
import type {
    ComplianceTemplateCreateInput,
    ComplianceTemplateUpdateInput,
    IComplianceTemplateRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { ComplianceTemplate } from '@/server/types/compliance-types';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import {
    mapComplianceTemplateInputToRecord,
    mapComplianceTemplateRecordToDomain,
    type ComplianceTemplateRecord as ComplianceTemplateMapperRecord,
} from '@/server/repositories/mappers/hr/compliance/compliance-template-mapper';
import { stampCreate, stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_COMPLIANCE_TEMPLATES } from '@/server/repositories/cache-scopes';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

type ComplianceTemplateRecord = PrismaComplianceTemplate;
type ComplianceTemplateCreateData = Prisma.ComplianceTemplateUncheckedCreateInput;
type ComplianceTemplateUpdateData = Prisma.ComplianceTemplateUncheckedUpdateInput;

export class PrismaComplianceTemplateRepository
    extends BasePrismaRepository
    implements IComplianceTemplateRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private get templates(): PrismaClient['complianceTemplate'] {
        return this.prisma.complianceTemplate;
    }

    private async ensureTemplateOrg(templateId: string, orgId: string): Promise<ComplianceTemplateRecord> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Compliance template not found for this organization.');
        }
        return record;
    }

    async createTemplate(input: ComplianceTemplateCreateInput): Promise<ComplianceTemplate> {
        const mapped = mapComplianceTemplateInputToRecord(input);

        // Validate items
        const validatedItems = z.array(complianceTemplateItemSchema).parse(mapped.items);

        const data: ComplianceTemplateCreateData = stampCreate({
            orgId: input.orgId,
            name: input.name,
            categoryKey: input.categoryKey ?? null,
            version: input.version ?? null,
            items: toRequiredJsonNullInput(validatedItems as unknown as Prisma.InputJsonValue),
            metadata: toRequiredJsonNullInput(mapped.metadata as unknown as Prisma.InputJsonValue),
        });
        const record = await this.templates.create({
            data,
        });
        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_COMPLIANCE_TEMPLATES,
            PrismaComplianceTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapComplianceTemplateRecordToDomain(record as unknown as ComplianceTemplateMapperRecord);
    }

    async updateTemplate(
        orgId: string,
        templateId: string,
        updates: ComplianceTemplateUpdateInput,
    ): Promise<ComplianceTemplate> {
        await this.ensureTemplateOrg(templateId, orgId);
        const mapped = mapComplianceTemplateInputToRecord(updates);

        // Validate items if present
        let itemsJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined = undefined;
        if (mapped.items !== undefined) {
            const validatedItems = z.array(complianceTemplateItemSchema).parse(mapped.items);
            itemsJson = toJsonNullInput(validatedItems as unknown as Prisma.InputJsonValue);
        }

        const data: ComplianceTemplateUpdateData = stampUpdate({
            ...mapped,
            orgId,
            items: itemsJson,
            metadata:
                mapped.metadata !== undefined
                    ? toJsonNullInput(mapped.metadata as unknown as Prisma.InputJsonValue)
                    : undefined,
        });
        const record = await this.templates.update({
            where: { id: templateId },
            data,
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_COMPLIANCE_TEMPLATES,
            PrismaComplianceTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapComplianceTemplateRecordToDomain(record as unknown as ComplianceTemplateMapperRecord);
    }

    async deleteTemplate(orgId: string, templateId: string): Promise<void> {
        await this.ensureTemplateOrg(templateId, orgId);
        await this.templates.delete({ where: { id: templateId } });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_COMPLIANCE_TEMPLATES,
            PrismaComplianceTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceTemplateRepository.DEFAULT_RESIDENCY,
        );
    }

    async getTemplate(orgId: string, templateId: string): Promise<ComplianceTemplate | null> {
        const record = await this.templates.findUnique({ where: { id: templateId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Compliance template access denied for this organization.');
        }
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_COMPLIANCE_TEMPLATES,
            PrismaComplianceTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceTemplateRepository.DEFAULT_RESIDENCY,
        );
        return mapComplianceTemplateRecordToDomain(record as unknown as ComplianceTemplateMapperRecord);
    }

    async listTemplates(orgId: string): Promise<ComplianceTemplate[]> {
        const records = await this.templates.findMany({ where: { orgId } });
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_COMPLIANCE_TEMPLATES,
            PrismaComplianceTemplateRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceTemplateRepository.DEFAULT_RESIDENCY,
        );
        return records.map((r) => mapComplianceTemplateRecordToDomain(r as unknown as ComplianceTemplateMapperRecord));
    }
}

function toJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    const resolved = toPrismaInputJson(value);
    if (resolved === Prisma.DbNull) {
        return Prisma.JsonNull;
    }
    return resolved as Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
}

function toRequiredJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return toJsonNullInput(value) ?? Prisma.JsonNull;
}
