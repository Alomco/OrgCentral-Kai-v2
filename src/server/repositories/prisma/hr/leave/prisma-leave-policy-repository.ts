import type { Prisma, LeavePolicy as PrismaLeavePolicy, LeavePolicyType as PrismaLeavePolicyType, LeaveAccrualFrequency as PrismaLeaveAccrualFrequency } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';
import type { LeavePolicyFilters, LeavePolicyCreationData, LeavePolicyUpdateData } from './prisma-leave-policy-repository.types';
import { mapCreateToPrisma, buildPrismaLeavePolicyUpdate, mapPrismaToDomain } from '@/server/repositories/mappers/hr/leave';
import { EntityNotFoundError } from '@/server/errors';
import { normalizeLeavePolicyUpdates } from './prisma-leave-policy-repository.helpers';

export class PrismaLeavePolicyRepository extends BasePrismaRepository implements ILeavePolicyRepository {
  // BasePrismaRepository enforces DI

  async findById(id: string): Promise<PrismaLeavePolicy | null> {
    return this.prisma.leavePolicy.findUnique({
      where: { id },
    });
  }

  async findByName(orgId: string, name: string): Promise<PrismaLeavePolicy | null> {
    return this.prisma.leavePolicy.findUnique({
      where: {
        orgId_name: {
          orgId,
          name
        }
      }
    });
  }

  async findDefault(orgId: string): Promise<PrismaLeavePolicy | null> {
    return this.prisma.leavePolicy.findFirst({
      where: {
        orgId,
        isDefault: true
      }
    });
  }

  async findAll(filters?: LeavePolicyFilters): Promise<PrismaLeavePolicy[]> {
    const whereClause: Prisma.LeavePolicyWhereInput = {};

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }

    if (filters?.policyType) {
      whereClause.policyType = filters.policyType;
    }

    if (filters?.isDefault !== undefined) {
      whereClause.isDefault = filters.isDefault;
    }

    if (filters?.active !== undefined) {
      if (filters.active) {
        whereClause.activeTo = { gte: new Date() };
        whereClause.activeFrom = { lte: new Date() };
      } else {
        whereClause.activeTo = { lt: new Date() };
      }
    }

    return this.prisma.leavePolicy.findMany({ where: whereClause, orderBy: { name: 'asc' } });
  }

  async create(data: LeavePolicyCreationData): Promise<PrismaLeavePolicy> {
    const createPayload = mapCreateToPrisma(data);
    return this.prisma.leavePolicy.create({ data: createPayload });
  }

  async update(id: string, data: LeavePolicyUpdateData): Promise<PrismaLeavePolicy> {
    const updatePayload = buildPrismaLeavePolicyUpdate(data);
    return this.prisma.leavePolicy.update({ where: { id }, data: updatePayload });
  }

  async delete(id: string): Promise<PrismaLeavePolicy> {
    return this.prisma.leavePolicy.delete({ where: { id } });
  }

  // Moved buildPrismaLeavePolicyUpdate to mapper to reduce repository LOC

  private assertPolicyOwnership(existing: PrismaLeavePolicy | null, tenantId: string): void {
    if (existing?.orgId !== tenantId) {
      throw new EntityNotFoundError('Leave policy', { orgId: tenantId, policyId: existing?.id });
    }
  }

  // --- Contract wrapper methods ---
  async createLeavePolicy(tenant: TenantScope, policy: Omit<LeavePolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const dataToCreate: LeavePolicyCreationData = {
      orgId: tenant.orgId,
      departmentId: policy.departmentId ?? undefined,
      name: policy.name,
      policyType: policy.policyType as PrismaLeavePolicyType,
      accrualFrequency: policy.accrualFrequency as PrismaLeaveAccrualFrequency,
      accrualAmount: policy.accrualAmount ?? undefined,
      carryOverLimit: policy.carryOverLimit ?? undefined,
      requiresApproval: policy.requiresApproval,
      isDefault: policy.isDefault,
      activeFrom: typeof policy.activeFrom === 'string' ? new Date(policy.activeFrom) : (policy.activeFrom as Date),
      activeTo:
        policy.activeTo ? (typeof policy.activeTo === 'string' ? new Date(policy.activeTo) : (policy.activeTo as Date)) : undefined,
      statutoryCompliance: policy.statutoryCompliance ?? false,
      maxConsecutiveDays: policy.maxConsecutiveDays ?? undefined,
      allowNegativeBalance: policy.allowNegativeBalance ?? false,
      dataClassification: policy.dataClassification,
      residencyTag: policy.dataResidency,
      auditSource: policy.auditSource,
      auditBatchId: policy.auditBatchId ?? tenant.auditBatchId,
      metadata: policy.metadata ?? undefined,
    };
    await this.create(dataToCreate);
  }

  async updateLeavePolicy(tenant: TenantScope, policyId: string, updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>): Promise<void> {
    const existing = await this.findById(policyId);
    this.assertPolicyOwnership(existing, tenant.orgId);
    const normalized = normalizeLeavePolicyUpdates(updates);
    const prismaUpdate = buildPrismaLeavePolicyUpdate(normalized);

    if (Object.keys(prismaUpdate).length === 0) {
      return;
    }

    if (updates.isDefault === true) {
      await this.prisma.$transaction([
        this.prisma.leavePolicy.updateMany({
          where: {
            orgId: tenant.orgId,
            id: { not: policyId },
            isDefault: true,
          },
          data: { isDefault: false },
        }),
        this.prisma.leavePolicy.update({ where: { id: policyId }, data: prismaUpdate }),
      ]);
      return;
    }

    await this.prisma.leavePolicy.update({ where: { id: policyId }, data: prismaUpdate });
  }

  async getLeavePolicy(tenant: TenantScope, policyId: string): Promise<LeavePolicy | null> {
    const rec = await this.findById(policyId);
    if (rec?.orgId !== tenant.orgId) { return null; }
    return mapPrismaToDomain(rec);
  }

  async getLeavePolicyByName(tenant: TenantScope, name: string): Promise<LeavePolicy | null> {
    const rec = await this.findByName(tenant.orgId, name);
    if (rec?.orgId !== tenant.orgId) {
      return null;
    }
    return mapPrismaToDomain(rec);
  }

  async getLeavePoliciesByOrganization(tenant: TenantScope): Promise<LeavePolicy[]> {
    const recs = await this.findAll({ orgId: tenant.orgId });
    return recs.map(mapPrismaToDomain);
  }

  async deleteLeavePolicy(tenant: TenantScope, policyId: string): Promise<void> {
    const rec = await this.findById(policyId);
    if (rec?.orgId !== tenant.orgId) { throw new EntityNotFoundError('Leave policy', { orgId: tenant.orgId, policyId }); }
    await this.delete(policyId);
  }
}
