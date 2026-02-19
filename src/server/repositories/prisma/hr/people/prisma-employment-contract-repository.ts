import { Prisma, type EmploymentContract as PrismaEmploymentContract } from '@prisma/client';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import { mapPrismaEmploymentContractToDomain } from '@/server/repositories/mappers/hr/people/employment-contract-mapper';
import type { EmploymentContractDTO, ContractListFilters } from '@/server/types/hr/people';
import type { EmploymentContractFilters, EmploymentContractCreationData, EmploymentContractUpdateData } from './prisma-employment-contract-repository.types';
import { EntityNotFoundError } from '@/server/errors';
import { HR_PEOPLE_CACHE_SCOPES } from '@/server/lib/cache-tags/hr-people';

export class PrismaEmploymentContractRepository extends BasePrismaRepository implements IEmploymentContractRepository {
  // BasePrismaRepository enforced DI
  constructor(options: BasePrismaRepositoryOptions = {}) {
    super(options);
  }

  private static toJsonInput(value?: Prisma.JsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === null) { return Prisma.JsonNull; }
    if (value === undefined) { return undefined; }
    return value as Prisma.InputJsonValue;
  }

  async findById(id: string): Promise<PrismaEmploymentContract | null> {
    return this.prisma.employmentContract.findUnique({
      where: { id },
    });
  }

  private static serializeLocation(loc?: EmploymentContractDTO['location'] | string): string | undefined {
    if (!loc) { return undefined; }
    if (typeof loc === 'string') { return loc; }
    return JSON.stringify(loc);
  }

  private static toOptionalDate(value: Date | string | null | undefined): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    return value instanceof Date ? value : new Date(value);
  }

  private static applyDateField(
    updateData: EmploymentContractUpdateData,
    key: 'endDate' | 'probationEndDate' | 'furloughStartDate' | 'furloughEndDate' | 'archivedAt',
    value: Date | string | null | undefined,
  ): void {
    if (value === undefined) {
      return;
    }
    updateData[key] = PrismaEmploymentContractRepository.toOptionalDate(value) as EmploymentContractUpdateData[typeof key];
  }

  private static applyValue<K extends keyof EmploymentContractUpdateData>(
    updateData: EmploymentContractUpdateData,
    key: K,
    value: EmploymentContractUpdateData[K] | undefined,
  ): void {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  async findByUserId(orgId: string, userId: string, activeOnly = true): Promise<PrismaEmploymentContract[]> {
    const whereClause: Prisma.EmploymentContractWhereInput = {
      orgId,
      userId,
    };

    if (activeOnly) {
      whereClause.archivedAt = null;
    }

    return this.prisma.employmentContract.findMany({ where: whereClause, orderBy: { startDate: 'desc' } });
  }

  async findAll(filters?: EmploymentContractFilters): Promise<PrismaEmploymentContract[]> {
    const whereClause: Prisma.EmploymentContractWhereInput = {};

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters?.contractType) {
      whereClause.contractType = filters.contractType as Prisma.EmploymentContractWhereInput['contractType'];
    }

    if (filters?.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }

    if (filters?.active !== undefined) {
      if (filters.active) {
        whereClause.archivedAt = null;
      } else {
        whereClause.NOT = { archivedAt: null };
      }
    }

    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      if (!Number.isNaN(start.getTime())) {
        whereClause.startDate = { gte: start };
      }
    }

    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      if (!Number.isNaN(end.getTime())) {
        whereClause.endDate = { lte: end };
      }
    }

    return this.prisma.employmentContract.findMany({ where: whereClause, orderBy: { startDate: 'desc' } });
  }

  async create(data: EmploymentContractCreationData): Promise<PrismaEmploymentContract> {
    return this.prisma.employmentContract.create({ data });
  }

  async update(id: string, data: EmploymentContractUpdateData): Promise<PrismaEmploymentContract> {
    return this.prisma.employmentContract.update({ where: { id }, data });
  }

  async archive(id: string): Promise<PrismaEmploymentContract> {
    return this.prisma.employmentContract.update({
      where: { id },
      data: {
        archivedAt: new Date()
      },
    });
  }

  async delete(id: string): Promise<PrismaEmploymentContract> {
    return this.prisma.employmentContract.delete({
      where: { id },
    });
  }

  // Contract wrappers
  async createEmploymentContract(tenantId: string, contract: Omit<EmploymentContractDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const createData: EmploymentContractCreationData = {
      orgId: tenantId,
      userId: contract.userId,
      contractType: contract.contractType as EmploymentContractCreationData['contractType'],
      startDate: contract.startDate instanceof Date ? contract.startDate : new Date(contract.startDate),
      endDate: contract.endDate ? (contract.endDate instanceof Date ? contract.endDate : new Date(contract.endDate)) : undefined,
      jobTitle: contract.jobTitle,
      departmentId: contract.departmentId ?? undefined,
      location: PrismaEmploymentContractRepository.serializeLocation(contract.location),
      probationEndDate: contract.probationEndDate ? (contract.probationEndDate instanceof Date ? contract.probationEndDate : new Date(contract.probationEndDate)) : undefined,
      furloughStartDate: contract.furloughStartDate ? (contract.furloughStartDate instanceof Date ? contract.furloughStartDate : new Date(contract.furloughStartDate)) : undefined,
      furloughEndDate: contract.furloughEndDate ? (contract.furloughEndDate instanceof Date ? contract.furloughEndDate : new Date(contract.furloughEndDate)) : undefined,
      workingPattern: PrismaEmploymentContractRepository.toJsonInput(contract.workingPattern as Prisma.JsonValue | null | undefined),
      benefits: PrismaEmploymentContractRepository.toJsonInput(contract.benefits as Prisma.JsonValue | null | undefined),
      terminationReason: contract.terminationReason ?? undefined,
      terminationNotes: contract.terminationNotes ?? undefined,
    };
    await this.create(createData);
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.contracts]);
  }

  async updateEmploymentContract(tenantId: string, contractId: string, updates: Partial<Omit<EmploymentContractDTO, 'id' | 'orgId' | 'employeeId' | 'userId' | 'createdAt'>>): Promise<void> {
    const existing = await this.findById(contractId);
    if (existing?.orgId !== tenantId) { throw new EntityNotFoundError('Employment contract', { contractId, orgId: tenantId }); }
    const updateData: EmploymentContractUpdateData = {};
    PrismaEmploymentContractRepository.applyDateField(updateData, 'endDate', updates.endDate);
    PrismaEmploymentContractRepository.applyDateField(updateData, 'probationEndDate', updates.probationEndDate);
    PrismaEmploymentContractRepository.applyDateField(updateData, 'furloughStartDate', updates.furloughStartDate);
    PrismaEmploymentContractRepository.applyDateField(updateData, 'furloughEndDate', updates.furloughEndDate);
    PrismaEmploymentContractRepository.applyDateField(updateData, 'archivedAt', updates.archivedAt);

    PrismaEmploymentContractRepository.applyValue(updateData, 'jobTitle', updates.jobTitle);
    PrismaEmploymentContractRepository.applyValue(updateData, 'departmentId', updates.departmentId ?? undefined);
    if (updates.location !== undefined) {
      updateData.location = PrismaEmploymentContractRepository.serializeLocation(updates.location as EmploymentContractDTO['location'] | string);
    }
    if (updates.workingPattern !== undefined) {
      updateData.workingPattern = PrismaEmploymentContractRepository.toJsonInput(updates.workingPattern as Prisma.JsonValue | null | undefined);
    }
    if (updates.benefits !== undefined) {
      updateData.benefits = PrismaEmploymentContractRepository.toJsonInput(updates.benefits as Prisma.JsonValue | null | undefined);
    }
    PrismaEmploymentContractRepository.applyValue(updateData, 'terminationReason', updates.terminationReason);
    PrismaEmploymentContractRepository.applyValue(updateData, 'terminationNotes', updates.terminationNotes);
    await this.update(contractId, updateData);
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.contracts]);
  }

  async getEmploymentContract(tenantId: string, contractId: string): Promise<EmploymentContractDTO | null> {
    const rec = await this.findById(contractId);
    if (!rec) { return null; }
    this.assertTenantRecord(rec, tenantId);
    return mapPrismaEmploymentContractToDomain(rec);
  }

  async getEmploymentContractByEmployee(tenantId: string, employeeId: string): Promise<EmploymentContractDTO | null> {
    const rec = await this.prisma.employmentContract.findFirst({ where: { orgId: tenantId, userId: employeeId } });
    if (!rec) { return null; }
    this.assertTenantRecord(rec, tenantId);
    return mapPrismaEmploymentContractToDomain(rec);
  }

  async getEmploymentContractsByEmployee(tenantId: string, employeeId: string): Promise<EmploymentContractDTO[]> {
    const recs = await this.findByUserId(tenantId, employeeId, false);
    return recs.map((rec) => mapPrismaEmploymentContractToDomain(rec));
  }

  async getEmploymentContractsByOrganization(tenantId: string, filters?: ContractListFilters): Promise<EmploymentContractDTO[]> {
    const recs = await this.findAll({
      orgId: tenantId,
      contractType: filters?.contractType,
      departmentId: filters?.departmentId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });
    return recs.map((r) => mapPrismaEmploymentContractToDomain(r));
  }

  async deleteEmploymentContract(tenantId: string, contractId: string): Promise<void> {
    const existing = await this.findById(contractId);
    if (existing?.orgId !== tenantId) { throw new EntityNotFoundError('Employment contract', { contractId, orgId: tenantId }); }
    await this.delete(contractId);
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.contracts]);
  }
}
