import type { IAuditLogRepository } from '@/server/repositories/contracts/records/audit-log-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AuditLogFilters, AuditLogRecord } from '@/server/types/records/audit-log';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';

export interface ListAuditLogsInput {
    authorization: RepositoryAuthorizationContext;
    filters: AuditLogFilters;
    limit: number;
}

export interface AuditLogServiceDependencies {
    auditLogRepository: IAuditLogRepository;
}

export class AuditLogService extends AbstractOrgService {
    constructor(private readonly dependencies: AuditLogServiceDependencies) {
        super();
    }

    async listLogs(input: ListAuditLogsInput): Promise<AuditLogRecord[]> {
        const limit = Math.max(1, Math.floor(input.limit));
        const context = this.buildContext(input.authorization, { metadata: { limit } });

        return this.executeInServiceContext(context, 'audit.logs.list', async () => {
            const logs = await this.dependencies.auditLogRepository.findAll(input.authorization, {
                ...input.filters,
                orgId: input.authorization.orgId,
            });
            return logs.slice(0, limit);
        });
    }
}
