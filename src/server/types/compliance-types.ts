import type { Prisma } from '@prisma/client';

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
    metadata?: Prisma.JsonValue;
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
    metadata?: Prisma.JsonValue;
}

export interface ComplianceCategory {
    id: string;
    orgId: string;
    key: string;
    label: string;
    sortOrder: number;
    metadata?: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
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
    attachments?: string[] | null;
    metadata?: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
}
