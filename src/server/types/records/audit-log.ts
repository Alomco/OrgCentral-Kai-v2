import type { JsonValue } from '@/server/types/json';

export type AuditEventType =
    | 'ACCESS'
    | 'DATA_CHANGE'
    | 'POLICY_CHANGE'
    | 'AUTH'
    | 'SYSTEM'
    | 'COMPLIANCE'
    | 'SECURITY'
    | 'DOCUMENT'
    | 'LEAVE_REQUEST'
    | 'PAYROLL';

export interface AuditLogRecord {
    id: string;
    orgId: string;
    userId: string | null;
    eventType: AuditEventType;
    action: string;
    resource: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionTokenHash?: string | null;
    securityLevel?: number | null;
    dataSubjectId?: string | null;
    immutable: boolean;
    deletedAt?: Date | null;
    payload?: JsonValue;
    createdAt: Date;
}

export interface AuditLogFilters {
    orgId?: string;
    userId?: string;
    eventType?: AuditEventType;
    action?: string;
    resource?: string;
    dataSubjectId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface AuditLogCreationData {
    orgId: string;
    userId?: string | null;
    eventType: AuditEventType;
    action: string;
    resource: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionTokenHash?: string | null;
    securityLevel?: number | null;
    dataSubjectId?: string | null;
    immutable?: boolean;
    payload?: JsonValue;
    createdAt?: Date;
}

export interface AuditLogUpdateData {
    deletedAt?: Date | null;
}
