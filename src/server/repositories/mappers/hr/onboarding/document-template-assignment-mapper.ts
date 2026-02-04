import type { JsonRecord } from '@/server/types/json';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { DocumentTemplateAssignmentRecord } from '@/server/types/hr/document-template-assignments';

export interface DocumentTemplateAssignmentPrismaRecord {
    id: string;
    orgId: string;
    employeeId: string;
    templateId: string;
    documentId: string | null;
    status: DocumentTemplateAssignmentRecord['status'];
    assignedAt: Date | string;
    completedAt: Date | string | null;
    signatureProvider: string | null;
    externalEnvelopeId: string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: DocumentTemplateAssignmentRecord['dataClassification'];
    residencyTag: DocumentTemplateAssignmentRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapDocumentTemplateAssignmentRecordToDomain(
    record: DocumentTemplateAssignmentPrismaRecord,
): DocumentTemplateAssignmentRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        templateId: record.templateId,
        documentId: record.documentId ?? undefined,
        status: record.status,
        assignedAt: record.assignedAt,
        completedAt: record.completedAt ?? undefined,
        signatureProvider: record.signatureProvider ?? undefined,
        externalEnvelopeId: record.externalEnvelopeId ?? undefined,
        metadata: (record.metadata ?? undefined) as JsonRecord | null | undefined,
        dataClassification: record.dataClassification,
        residencyTag: record.residencyTag,
        auditSource: record.auditSource ?? undefined,
        correlationId: record.correlationId ?? undefined,
        createdBy: record.createdBy ?? undefined,
        updatedBy: record.updatedBy ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
