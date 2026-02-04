import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';

export interface DocumentTemplatePrismaRecord {
    id: string;
    orgId: string;
    name: string;
    type: DocumentTemplateRecord['type'];
    templateBody: string;
    templateSchema: PrismaJsonValue | null;
    version: number;
    isActive: boolean;
    metadata: PrismaJsonValue | null;
    dataClassification: DocumentTemplateRecord['dataClassification'];
    residencyTag: DocumentTemplateRecord['residencyTag'];
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapDocumentTemplateRecordToDomain(record: DocumentTemplatePrismaRecord): DocumentTemplateRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        type: record.type,
        templateBody: record.templateBody,
        templateSchema: record.templateSchema as JsonValue | null | undefined,
        version: record.version,
        isActive: record.isActive,
        metadata: (record.metadata ?? undefined) as JsonRecord | null | undefined,
        dataClassification: record.dataClassification,
        residencyTag: record.residencyTag,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
