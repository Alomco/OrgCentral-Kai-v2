import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { DocumentType } from '@/server/types/records/document-vault';

export interface DocumentTemplateRecord {
    id: string;
    orgId: string;
    name: string;
    type: DocumentType;
    templateBody: string;
    templateSchema?: JsonValue | null;
    version: number;
    isActive: boolean;
    metadata?: JsonRecord | null;
    dataClassification?: DataClassificationLevel;
    residencyTag?: DataResidencyZone;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface DocumentTemplateCreateInput {
    orgId: string;
    name: string;
    type: DocumentType;
    templateBody: string;
    templateSchema?: JsonValue | null;
    version?: number;
    isActive?: boolean;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
}

export interface DocumentTemplateUpdateInput {
    name?: string;
    type?: DocumentType;
    templateBody?: string;
    templateSchema?: JsonValue | null;
    version?: number;
    isActive?: boolean;
    metadata?: JsonRecord | null;
}
