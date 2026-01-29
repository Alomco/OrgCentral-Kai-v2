import { getAuditLogRepository } from '@/server/repositories/providers/records/audit-log-repository-provider';
import { AuditLogService, type AuditLogServiceDependencies } from './audit-log-service';

let sharedService: AuditLogService | null = null;

export function getAuditLogService(
    overrides: Partial<AuditLogServiceDependencies> = {},
): AuditLogService {
    sharedService ??= new AuditLogService({
        auditLogRepository: overrides.auditLogRepository ?? getAuditLogRepository(),
    });
    return sharedService;
}

export type AuditLogServiceContract = Pick<AuditLogService, 'listLogs'>;
