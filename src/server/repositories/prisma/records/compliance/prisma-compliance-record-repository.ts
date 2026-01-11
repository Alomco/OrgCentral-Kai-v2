import type { ComplianceRecord, Prisma } from '@prisma/client';
import type { IComplianceRecordRepository } from '@/server/repositories/contracts/records/compliance-record-repository-contract';
import { getModelDelegate, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { ComplianceRecordFilters, ComplianceRecordCreationData, ComplianceRecordUpdateData } from './prisma-compliance-record-repository.types';

export class PrismaComplianceRecordRepository extends BasePrismaRepository implements IComplianceRecordRepository {
  async findById(id: string): Promise<ComplianceRecord | null> {
    return getModelDelegate(this.prisma, 'complianceRecord').findUnique({
      where: { id },
    });
  }

  async findByReferenceNumber(orgId: string, referenceNumber: string): Promise<ComplianceRecord | null> {
    return getModelDelegate(this.prisma, 'complianceRecord').findFirst({
      where: { orgId, referenceNumber },
    });
  }

  async findAll(filters?: ComplianceRecordFilters): Promise<ComplianceRecord[]> {
    const whereClause: Prisma.ComplianceRecordWhereInput = {};

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.complianceType) {
      whereClause.complianceType = filters.complianceType;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters?.submittedByUserId) {
      whereClause.submittedByUserId = filters.submittedByUserId;
    }
    if (filters?.submittedByOrgId) {
      whereClause.submittedByOrgId = filters.submittedByOrgId;
    }

    if (filters?.assignedToUserId) {
      whereClause.assignedToUserId = filters.assignedToUserId;
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

    return getModelDelegate(this.prisma, 'complianceRecord').findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: ComplianceRecordCreationData): Promise<ComplianceRecord> {
    return getModelDelegate(this.prisma, 'complianceRecord').create({
      data: {
        ...data,
        status: data.status ?? 'open',
        priority: data.priority ?? 2,
        submittedAt: data.submittedAt ?? new Date(),
        metadata: data.metadata ? toPrismaInputJson(data.metadata) as Prisma.InputJsonValue : undefined,
      },
    });
  }

  async update(id: string, data: ComplianceRecordUpdateData): Promise<ComplianceRecord> {
    const updateData = {
      ...data,
      metadata: data.metadata !== undefined ? (toPrismaInputJson(data.metadata) as Prisma.InputJsonValue) : undefined,
    };
    return getModelDelegate(this.prisma, 'complianceRecord').update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<ComplianceRecord> {
    return getModelDelegate(this.prisma, 'complianceRecord').delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<ComplianceRecord> {
    return getModelDelegate(this.prisma, 'complianceRecord').update({
      where: { id },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      },
    });
  }
}
