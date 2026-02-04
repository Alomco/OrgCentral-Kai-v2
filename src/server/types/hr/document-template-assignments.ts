import type { JsonRecord } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const DOCUMENT_ASSIGNMENT_STATUS_VALUES = ['PENDING', 'COMPLETED', 'WAIVED'] as const;
export type DocumentAssignmentStatus = (typeof DOCUMENT_ASSIGNMENT_STATUS_VALUES)[number];

export interface DocumentTemplateAssignmentRecord {
    id: string;
    orgId: string;
    employeeId: string;
    templateId: string;
    documentId?: string | null;
    status: DocumentAssignmentStatus;
    assignedAt: Date | string;
    completedAt?: Date | string | null;
    signatureProvider?: string | null;
    externalEnvelopeId?: string | null;
    metadata?: JsonRecord | null;
    dataClassification?: DataClassificationLevel;
    residencyTag?: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface DocumentTemplateAssignmentCreateInput {
    orgId: string;
    employeeId: string;
    templateId: string;
    documentId?: string | null;
    status?: DocumentAssignmentStatus;
    signatureProvider?: string | null;
    externalEnvelopeId?: string | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface DocumentTemplateAssignmentUpdateInput {
    status?: DocumentAssignmentStatus;
    documentId?: string | null;
    completedAt?: Date | null;
    signatureProvider?: string | null;
    externalEnvelopeId?: string | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}
