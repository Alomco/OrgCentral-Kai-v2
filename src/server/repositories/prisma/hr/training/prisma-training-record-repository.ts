import type { TrainingRecord as PrismaTrainingRecord, Prisma } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { ITrainingRecordRepository } from '@/server/repositories/contracts/hr/training/training-record-repository-contract';
import { mapPrismaTrainingRecordToDomain, mapDomainTrainingRecordToPrisma, mapDomainTrainingUpdateToPrisma } from '@/server/repositories/mappers/hr/training/training-mapper';
import type { TrainingRecord as DomainTrainingRecord } from '@/server/types/hr-types';
import type { TrainingRecordFilters, TrainingRecordCreationData, TrainingRecordUpdateData } from './prisma-training-record-repository.types';
import { EntityNotFoundError } from '@/server/errors';

export class PrismaTrainingRecordRepository extends BasePrismaRepository implements ITrainingRecordRepository {
  async findById(id: string): Promise<PrismaTrainingRecord | null> {
    return this.prisma.trainingRecord.findUnique({ where: { id } });
  }

  async findByUserId(orgId: string, userId: string): Promise<PrismaTrainingRecord[]> {
    return this.prisma.trainingRecord.findMany({ where: { orgId, userId }, orderBy: { startDate: 'desc' } });
  }

  async findAll(filters?: TrainingRecordFilters): Promise<PrismaTrainingRecord[]> {
    const whereClause: Prisma.TrainingRecordWhereInput = {};

    if (filters?.orgId) { whereClause.orgId = filters.orgId; }

    if (filters?.userId) { whereClause.userId = filters.userId; }

    if (filters?.courseName) { whereClause.courseName = { contains: filters.courseName, mode: 'insensitive' }; }

    if (filters?.status) { whereClause.status = filters.status; }

    if (filters?.startDate) { whereClause.startDate = { gte: filters.startDate }; }

    if (filters?.endDate) { whereClause.endDate = { lte: filters.endDate }; }

    if (filters && (filters.expiryAfter !== undefined || filters.expiryBefore !== undefined)) {
      const expiryFilter: Prisma.DateTimeNullableFilter = {};
      if (filters.expiryAfter !== undefined) { expiryFilter.gte = filters.expiryAfter; }
      if (filters.expiryBefore !== undefined) { expiryFilter.lte = filters.expiryBefore; }
      whereClause.expiryDate = expiryFilter;
    }

    return this.prisma.trainingRecord.findMany({ where: whereClause, orderBy: { startDate: 'desc' } });
  }

  async create(data: TrainingRecordCreationData): Promise<PrismaTrainingRecord> {
    const prismaCreate = { ...data, status: data.status ?? 'in_progress', approved: data.approved ?? false };
    return this.prisma.trainingRecord.create({ data: prismaCreate });
  }

  async update(id: string, data: TrainingRecordUpdateData): Promise<PrismaTrainingRecord> {
    const prismaUpdate = data;
    return this.prisma.trainingRecord.update({ where: { id }, data: prismaUpdate });
  }

  async delete(id: string): Promise<PrismaTrainingRecord> {
    return this.prisma.trainingRecord.delete({ where: { id } });
  }

  // Contract methods returning domain models
  async getTrainingRecord(id: string): Promise<DomainTrainingRecord | null> {
    const rec = await this.findById(id);
    if (!rec) { return null; }
    return mapPrismaTrainingRecordToDomain(rec);
  }

  async getTrainingRecordsByUser(orgId: string, userId: string): Promise<DomainTrainingRecord[]> {
    const recs = await this.findByUserId(orgId, userId);
    return recs.map(mapPrismaTrainingRecordToDomain);
  }

  async listTrainingRecords(filters?: TrainingRecordFilters): Promise<DomainTrainingRecord[]> {
    const recs = await this.findAll(filters);
    return recs.map(mapPrismaTrainingRecordToDomain);
  }

  async addTrainingRecord(orgId: string, record: Omit<DomainTrainingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const input = { ...record, orgId, createdAt: new Date(), updatedAt: new Date() } as DomainTrainingRecord;
    const prismaCreate = mapDomainTrainingRecordToPrisma(input);
    await this.create(prismaCreate);
  }

  // --- Contract-facing aliases ---
  async createTrainingRecord(tenantId: string, record: Omit<DomainTrainingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.addTrainingRecord(tenantId, record);
  }

  async removeTrainingRecord(id: string): Promise<void> {
    await this.delete(id);
  }

  async deleteTrainingRecord(tenantId: string, recordId: string): Promise<void> {
    const existing = await this.findById(recordId);
    if (existing?.orgId !== tenantId) { throw new EntityNotFoundError('Training record', { recordId, orgId: tenantId }); }
    await this.delete(recordId);
  }

  async updateTrainingRecord(tenantId: string, recordId: string, updates: Partial<Omit<DomainTrainingRecord, 'id' | 'orgId' | 'createdAt' | 'userId'>>): Promise<void> {
    const existing = await this.findById(recordId);
    if (existing?.orgId !== tenantId) { throw new EntityNotFoundError('Training record', { recordId, orgId: tenantId }); }
    const updateData = mapDomainTrainingUpdateToPrisma(updates);
    await this.update(recordId, updateData);
  }

  async getTrainingRecordsByEmployee(tenantId: string, employeeId: string): Promise<DomainTrainingRecord[]> {
    return this.getTrainingRecordsByUser(tenantId, employeeId);
  }

  async getTrainingRecordsByOrganization(tenantId: string, filters?: {
    status?: string;
    trainingTitle?: string;
    startDate?: Date;
    endDate?: Date;
    employeeId?: string;
    userId?: string;
    expiryAfter?: Date;
    expiryBefore?: Date;
  }): Promise<DomainTrainingRecord[]> {
    const where: TrainingRecordFilters = { orgId: tenantId };
    if (filters?.status) { where.status = filters.status; }
    if (filters?.trainingTitle) { where.courseName = filters.trainingTitle; }
    if (filters?.startDate) { where.startDate = filters.startDate; }
    if (filters?.endDate) { where.endDate = filters.endDate; }
    if (filters?.expiryAfter) { where.expiryAfter = filters.expiryAfter; }
    if (filters?.expiryBefore) { where.expiryBefore = filters.expiryBefore; }
    const requestedUser = filters?.userId ?? filters?.employeeId;
    if (requestedUser) { where.userId = requestedUser; }
    const recs = await this.findAll(where);
    return recs.map(mapPrismaTrainingRecordToDomain);
  }
}
