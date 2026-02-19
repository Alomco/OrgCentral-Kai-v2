import type { Prisma } from '../../../../../generated/client';
import type { ComplianceCategory } from '@/server/types/compliance-types';

export interface ComplianceCategoryUpsertInput {
    orgId: string;
    key: string;
    label: string;
    sortOrder?: number;
    metadata?: Prisma.JsonValue;
}

export interface IComplianceCategoryRepository {
    listCategories(orgId: string): Promise<ComplianceCategory[]>;
    upsertCategory(input: ComplianceCategoryUpsertInput): Promise<ComplianceCategory>;
}
