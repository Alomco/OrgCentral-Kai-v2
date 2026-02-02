import type {
    ComplianceAssignmentInput,
    ComplianceItemUpdateInput,
} from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { ComplianceAttachment, ComplianceItemStatus, ComplianceLogItem } from '@/server/types/compliance-types';
import type { PrismaJsonValue } from '@/server/types/prisma';
import { complianceAttachmentsSchema } from '@/server/validators/hr/compliance/compliance-validators';

export interface ComplianceLogItemRecord {
    id: string;
    orgId: string;
    userId: string;
    templateItemId: string;
    categoryKey?: string | null;
    status: ComplianceItemStatus;
    dueDate?: Date | string | null;
    completedAt?: Date | string | null;
    reviewedBy?: string | null;
    reviewedAt?: Date | string | null;
    notes?: string | null;
    attachments?: PrismaJsonValue | ComplianceAttachment[] | string[] | null;
    metadata?: PrismaJsonValue | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapComplianceLogRecordToDomain(record: ComplianceLogItemRecord): ComplianceLogItem {
    return {
        id: record.id,
        orgId: record.orgId,
        userId: record.userId,
        templateItemId: record.templateItemId,
        categoryKey: record.categoryKey ?? undefined,
        status: record.status,
        dueDate:
            record.dueDate === undefined || record.dueDate === null
                ? null
                : record.dueDate instanceof Date
                    ? record.dueDate
                    : new Date(record.dueDate),
        completedAt:
            record.completedAt === undefined || record.completedAt === null
                ? null
                : record.completedAt instanceof Date
                    ? record.completedAt
                    : new Date(record.completedAt),
        reviewedBy: record.reviewedBy ?? null,
        reviewedAt:
            record.reviewedAt === undefined || record.reviewedAt === null
                ? null
                : record.reviewedAt instanceof Date
                    ? record.reviewedAt
                    : new Date(record.reviewedAt),
        notes: record.notes ?? null,
        attachments: normalizeComplianceAttachments(record.attachments),
        metadata: record.metadata ?? undefined,
        createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
    };
}

export function mapComplianceAssignmentInputToRecord(
    input: ComplianceAssignmentInput,
): Omit<ComplianceLogItemRecord, 'id' | 'createdAt' | 'updatedAt'>[] {
    return input.templateItemIds.map((templateItemId) => ({
        orgId: input.orgId,
        userId: input.userId,
        templateItemId,
        categoryKey: undefined,
        status: 'PENDING',
        dueDate: input.dueDate ?? null,
        completedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        notes: undefined,
        attachments: undefined,
        metadata: input.metadata ?? null,
    }));
}

export function mapComplianceItemUpdateToRecord(
    updates: ComplianceItemUpdateInput,
): Partial<ComplianceLogItemRecord> {
    const payload: Partial<ComplianceLogItemRecord> = {};
    if (updates.status !== undefined) { payload.status = updates.status; }
    if (updates.notes !== undefined) { payload.notes = updates.notes; }
    if (updates.attachments !== undefined) { payload.attachments = updates.attachments; }
    if (updates.completedAt !== undefined) { payload.completedAt = updates.completedAt; }
    if (updates.reviewedBy !== undefined) { payload.reviewedBy = updates.reviewedBy; }
    if (updates.reviewedAt !== undefined) { payload.reviewedAt = updates.reviewedAt; }
    if (updates.dueDate !== undefined) { payload.dueDate = updates.dueDate; }
    if (updates.metadata !== undefined) { payload.metadata = updates.metadata; }
    return payload;
}

function normalizeComplianceAttachments(
    value: PrismaJsonValue | ComplianceAttachment[] | string[] | null | undefined,
): ComplianceAttachment[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const parsed = complianceAttachmentsSchema.safeParse(value);
    if (!parsed.success) {
        return null;
    }

    return parsed.data.map((item) => ({
        ...item,
        uploadedAt: new Date(item.uploadedAt),
    }));
}
