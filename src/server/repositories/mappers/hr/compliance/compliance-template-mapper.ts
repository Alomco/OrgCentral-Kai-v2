import type {
    ComplianceTemplateCreateInput,
    ComplianceTemplateUpdateInput,
} from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { ComplianceTemplate, ComplianceTemplateItem } from '@/server/types/compliance-types';
import type { JsonValue } from '@/server/repositories/prisma/helpers/prisma-utils';
import { normalizeMetadata } from '@/server/repositories/mappers/metadata';

export interface ComplianceTemplateRecord {
    id: string;
    orgId: string;
    name: string;
    categoryKey?: string | null;
    version?: string | null;
    items: ComplianceTemplateItem[] | JsonValue | null | undefined;
    createdAt: Date | string;
    updatedAt: Date | string;
    metadata?: JsonValue | null;
}

export function mapComplianceTemplateRecordToDomain(record: ComplianceTemplateRecord): ComplianceTemplate {
    const items =
        Array.isArray(record.items)
            ? (record.items as ComplianceTemplateItem[])
            : [];
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        categoryKey: record.categoryKey ?? undefined,
        version: record.version ?? undefined,
        items,
        createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
        metadata: normalizeMetadata(record.metadata),
    };
}

export function mapComplianceTemplateInputToRecord(
    input: ComplianceTemplateCreateInput | ComplianceTemplateUpdateInput,
): Partial<ComplianceTemplateRecord> {
    const payload: Partial<ComplianceTemplateRecord> = {};
    if ('orgId' in input) {payload.orgId = input.orgId;}
    if (input.name !== undefined) {payload.name = input.name;}
    if (input.categoryKey !== undefined) {payload.categoryKey = input.categoryKey;}
    if (input.version !== undefined) {payload.version = input.version;}
    if (input.items !== undefined) {payload.items = input.items;}
    if ('metadata' in input && input.metadata !== undefined) {payload.metadata = input.metadata;}
    return payload;
}
