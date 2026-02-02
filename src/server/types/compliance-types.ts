import type { PrismaJsonValue } from '@/server/types/prisma';
import type { RetentionPolicy, SecurityClassification } from '@/server/types/records/document-vault';
import type { ComplianceStandardKey } from '@/server/types/hr/compliance-standards';

export type ComplianceSubDocumentType = 'DOCUMENT' | 'COMPLETION_DATE' | 'YES_NO' | 'ACKNOWLEDGEMENT';

export interface ComplianceTemplateItem {
    id: string;
    name: string;
    type: ComplianceSubDocumentType;
    isMandatory: boolean;
    guidanceText?: string;
    allowedFileTypes?: ('pdf' | 'docx' | 'jpg' | 'png')[];
    yesNoPrompt?: string;
    acknowledgementText?: string;
    reminderDaysBeforeExpiry?: number;
    expiryDurationDays?: number;
    isInternalOnly?: boolean;
    regulatoryRefs?: ComplianceStandardKey[];
    metadata?: PrismaJsonValue;
}

export interface ComplianceTemplate {
    id: string;
    orgId: string;
    name: string;
    categoryKey?: string;
    version?: string;
    items: ComplianceTemplateItem[];
    createdAt: Date;
    updatedAt: Date;
    metadata?: PrismaJsonValue;
}

export interface ComplianceCategory {
    id: string;
    orgId: string;
    key: string;
    label: string;
    sortOrder: number;
    metadata?: PrismaJsonValue | ComplianceCategoryMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export interface ComplianceCategoryMetadata {
    regulatoryRefs?: ComplianceStandardKey[];
}

export const COMPLIANCE_ITEM_STATUSES = [
    'PENDING',
    'COMPLETE',
    'MISSING',
    'PENDING_REVIEW',
    'NOT_APPLICABLE',
    'EXPIRED',
] as const;

export type ComplianceItemStatus = (typeof COMPLIANCE_ITEM_STATUSES)[number];

export interface ComplianceLogItem {
    id: string;
    orgId: string;
    userId: string;
    templateItemId: string;
    categoryKey?: string;
    status: ComplianceItemStatus;
    dueDate?: Date | null;
    completedAt?: Date | null;
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    notes?: string | null;
    attachments?: ComplianceAttachment[] | null;
    metadata?: PrismaJsonValue;
    createdAt: Date;
    updatedAt: Date;
}

export interface ComplianceAttachment {
    documentId: string;
    fileName: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    classification: SecurityClassification;
    retentionPolicy: RetentionPolicy;
    version: number;
    uploadedAt: Date;
}

export type ComplianceAttachmentInput = Omit<ComplianceAttachment, 'uploadedAt'> & {
    uploadedAt: string;
};
