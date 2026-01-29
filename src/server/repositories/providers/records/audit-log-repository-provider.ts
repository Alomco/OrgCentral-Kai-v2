import type { IAuditLogRepository } from '@/server/repositories/contracts/records/audit-log-repository-contract';
import { PrismaAuditLogRepository } from '@/server/repositories/prisma/records/audit/prisma-audit-log-repository';

let sharedRepository: IAuditLogRepository | null = null;

export function getAuditLogRepository(): IAuditLogRepository {
    sharedRepository ??= new PrismaAuditLogRepository();
    return sharedRepository;
}
