import type { Prisma, PrismaClient } from '@prisma/client';
import type { IAuditLogRepository } from '@/server/repositories/contracts/records/audit-log-repository-contract';
import { getModelDelegate, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { AuditLogFilters, AuditLogCreationData, AuditLogRecord } from './prisma-audit-log-repository.types';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';

export class PrismaAuditLogRepository extends BasePrismaRepository implements IAuditLogRepository {
  constructor(prisma: PrismaClient = defaultPrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<AuditLogRecord | null> {
    return getModelDelegate(this.prisma, 'auditLog').findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAll(filters?: AuditLogFilters): Promise<AuditLogRecord[]> {
    const whereClause: Prisma.AuditLogWhereInput = {};

    whereClause.deletedAt = null;

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters?.eventType) {
      whereClause.eventType = filters.eventType;
    }

    if (filters?.action) {
      whereClause.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters?.resource) {
      whereClause.resource = { contains: filters.resource, mode: 'insensitive' };
    }

    if (filters?.dataSubjectId) {
      whereClause.dataSubjectId = filters.dataSubjectId;
    }

    const dateFrom = filters?.dateFrom;
    const dateTo = filters?.dateTo;
    if (dateFrom && dateTo) {
      whereClause.createdAt = { gte: dateFrom, lte: dateTo };
    } else if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    } else if (dateTo) {
      whereClause.createdAt = { lte: dateTo };
    }

    return getModelDelegate(this.prisma, 'auditLog').findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: AuditLogCreationData): Promise<AuditLogRecord> {
    return getModelDelegate(this.prisma, 'auditLog').create({
      data: {
        ...data,
        payload: toPrismaInputJson(data.payload) as Prisma.InputJsonValue,
      },
    });
  }

  async createBulk(data: AuditLogCreationData[]): Promise<AuditLogRecord[]> {
    const normalized = data.map((item) => ({
      ...item,
      payload: toPrismaInputJson(item.payload) as Prisma.InputJsonValue,
    }));
    return getModelDelegate(this.prisma, 'auditLog')
      .createMany({
        data: normalized,
        skipDuplicates: true,
      })
      .then(() => []);
  }

  delete(_id: string): Promise<AuditLogRecord> {
    void _id;
    return Promise.reject(new Error('Audit logs are immutable; use retention workflows to expire records.'));
  }

  async deleteByRetentionPolicy(orgId: string, retentionDate: Date): Promise<number> {
    const result = await getModelDelegate(this.prisma, 'auditLog').updateMany({
      where: {
        orgId,
        createdAt: { lt: retentionDate },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      }
    });
    return result.count;
  }
}
