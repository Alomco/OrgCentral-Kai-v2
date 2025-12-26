import type { ComplianceItemStatus, ComplianceLogItem } from '@/server/types/compliance-types';
import type { Prisma } from '@prisma/client';

export interface ComplianceAssignmentInput {
    orgId: string;
    userId: string;
    templateId: string;
    templateItemIds: string[];
    assignedBy: string;
    dueDate?: Date | null;
    metadata?: Prisma.JsonValue;
}

export interface ComplianceItemUpdateInput {
    status?: ComplianceItemStatus;
    notes?: string | null;
    attachments?: string[] | null;
    completedAt?: Date | null;
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    dueDate?: Date | null;
    metadata?: Prisma.JsonValue;
}

export interface IComplianceItemRepository {
    assignItems(input: ComplianceAssignmentInput): Promise<void>;
    getItem(orgId: string, userId: string, itemId: string): Promise<ComplianceLogItem | null>;
    listItemsForUser(orgId: string, userId: string): Promise<ComplianceLogItem[]>;
    listPendingReviewItemsForOrg(orgId: string, take?: number): Promise<ComplianceLogItem[]>;
    updateItem(orgId: string, userId: string, itemId: string, updates: ComplianceItemUpdateInput): Promise<ComplianceLogItem>;
    deleteItem(orgId: string, userId: string, itemId: string): Promise<void>;
    findExpiringItemsForOrg(
        orgId: string,
        referenceDate: Date,
        daysUntilExpiry: number,
    ): Promise<ComplianceLogItem[]>;
}
