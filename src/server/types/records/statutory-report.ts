import type { JsonValue } from '@/server/types/json';

export interface StatutoryReportRecord {
    id: string;
    orgId: string;
    reportType: string;
    period: string;
    dueDate: Date;
    submittedAt?: Date | null;
    submittedByOrgId?: string | null;
    submittedByUserId?: string | null;
    status: string;
    fileName?: string | null;
    fileSize?: number | null;
    checksum?: string | null;
    metadata?: JsonValue;
    createdAt: Date;
    updatedAt: Date;
}

export interface StatutoryReportFilters {
    orgId?: string;
    reportType?: string;
    period?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface StatutoryReportCreationData {
    orgId: string;
    reportType: string;
    period: string;
    dueDate: Date;
    submittedByOrgId?: string;
    submittedByUserId?: string;
    status?: string;
    fileName?: string;
    fileSize?: number;
    checksum?: string;
    metadata?: Record<string, JsonValue> | JsonValue;
    submittedAt?: Date;
}

export interface StatutoryReportUpdateData {
    status?: string;
    fileName?: string;
    fileSize?: number;
    checksum?: string;
    submittedByOrgId?: string;
    submittedByUserId?: string;
    submittedAt?: Date;
    metadata?: Record<string, JsonValue> | JsonValue;
}
