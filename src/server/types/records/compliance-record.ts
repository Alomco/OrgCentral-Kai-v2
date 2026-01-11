import type { JsonValue } from '@/server/types/json';

export interface ComplianceRecord {
    id: string;
    orgId: string;
    complianceType: string;
    referenceNumber: string;
    status: string;
    title: string;
    description: string;
    assignedToOrgId?: string | null;
    assignedToUserId?: string | null;
    priority: number;
    dueDate?: Date | null;
    completedAt?: Date | null;
    submittedByOrgId?: string | null;
    submittedByUserId?: string | null;
    submittedAt?: Date | null;
    responseDate?: Date | null;
    escalationDate?: Date | null;
    metadata?: JsonValue;
    createdAt: Date;
    updatedAt: Date;
}

export interface ComplianceRecordFilters {
    orgId?: string;
    complianceType?: string;
    status?: string;
    priority?: number;
    submittedByOrgId?: string;
    submittedByUserId?: string;
    assignedToUserId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface ComplianceRecordCreationData {
    orgId: string;
    complianceType: string;
    referenceNumber: string;
    status?: string;
    title: string;
    description: string;
    assignedToOrgId?: string;
    assignedToUserId?: string;
    priority?: number;
    dueDate?: Date;
    submittedByOrgId?: string;
    submittedByUserId?: string;
    submittedAt?: Date;
    escalationDate?: Date;
    metadata?: Record<string, JsonValue> | JsonValue;
}

export interface ComplianceRecordUpdateData {
    status?: string;
    assignedToOrgId?: string;
    assignedToUserId?: string;
    priority?: number;
    dueDate?: Date;
    completedAt?: Date;
    responseDate?: Date;
    escalationDate?: Date;
    metadata?: Record<string, JsonValue> | JsonValue;
}
