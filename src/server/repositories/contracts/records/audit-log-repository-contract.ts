import type { AuditLogRecord, AuditLogCreationData, AuditLogFilters } from '@/server/types/records/audit-log';

export interface IAuditLogRepository {
    findById(id: string): Promise<AuditLogRecord | null>;
    findAll(filters?: AuditLogFilters): Promise<AuditLogRecord[]>;
    create(data: AuditLogCreationData): Promise<AuditLogRecord>;
    createBulk(data: AuditLogCreationData[]): Promise<AuditLogRecord[]>;
    delete(id: string): Promise<AuditLogRecord>;
    deleteByRetentionPolicy(orgId: string, retentionDate: Date): Promise<number>;
}
