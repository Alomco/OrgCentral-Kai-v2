import { Prisma, type PrismaClient } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { stampCreate, stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import type {
    ComplianceCategoryUpsertInput,
    IComplianceCategoryRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-category-repository-contract';
import type { ComplianceCategory } from '@/server/types/compliance-types';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_COMPLIANCE_CATEGORIES } from '@/server/repositories/cache-scopes';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

interface ComplianceCategoryRecord {
    id: string;
    orgId: string;
    key: string;
    label: string;
    sortOrder: number;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
}

function mapRecordToDomain(record: ComplianceCategoryRecord): ComplianceCategory {
    return {
        id: record.id,
        orgId: record.orgId,
        key: record.key,
        label: record.label,
        sortOrder: record.sortOrder,
        metadata: record.metadata,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export class PrismaComplianceCategoryRepository
    extends BasePrismaRepository
    implements IComplianceCategoryRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private get categories() {
        return (this.prisma as PrismaClient & { complianceCategory: unknown }).complianceCategory;
    }

    async listCategories(orgId: string): Promise<ComplianceCategory[]> {
        const records: ComplianceCategoryRecord[] = await (this.categories as {
            findMany: (args: unknown) => Promise<ComplianceCategoryRecord[]>;
        }).findMany({ where: { orgId }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_COMPLIANCE_CATEGORIES,
            PrismaComplianceCategoryRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceCategoryRepository.DEFAULT_RESIDENCY,
        );
        return records.map(mapRecordToDomain);
    }

    async upsertCategory(input: ComplianceCategoryUpsertInput): Promise<ComplianceCategory> {
        const safeSortOrder = Number.isFinite(input.sortOrder) ? Math.max(0, Math.min(10000, input.sortOrder ?? 100)) : 100;

        const record: ComplianceCategoryRecord = await (this.categories as {
            upsert: (args: unknown) => Promise<ComplianceCategoryRecord>;
        }).upsert({
            where: { orgId_key: { orgId: input.orgId, key: input.key } },
            create: stampCreate({
                orgId: input.orgId,
                key: input.key,
                label: input.label,
                sortOrder: safeSortOrder,
                metadata: toPrismaInputJson(input.metadata as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            }),
            update: stampUpdate({
                label: input.label,
                sortOrder: safeSortOrder,
                metadata: toPrismaInputJson(input.metadata as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            }),
        });

        await invalidateOrgCache(
            input.orgId,
            CACHE_SCOPE_COMPLIANCE_CATEGORIES,
            PrismaComplianceCategoryRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceCategoryRepository.DEFAULT_RESIDENCY,
        );
        return mapRecordToDomain(record);
    }
}
