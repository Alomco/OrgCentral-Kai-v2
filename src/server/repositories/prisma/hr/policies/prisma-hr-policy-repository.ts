import type { Prisma } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IHRPolicyRepository } from '@/server/repositories/contracts/hr/policies/hr-policy-repository-contract';
import { mapDomainHRPolicyToPrismaCreate, mapDomainHRPolicyToPrismaUpdate, mapPrismaHRPolicyToDomain } from '@/server/repositories/mappers/hr/policies/hr-policy-mapper';
import type { HRPolicy } from '@/server/types/hr-ops-types';
import { AuthorizationError } from '@/server/errors';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_HR_POLICIES } from '@/server/repositories/cache-scopes';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export class PrismaHRPolicyRepository extends BasePrismaRepository implements IHRPolicyRepository {
  private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
  private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
  async createPolicy(
    orgId: string,
    input: Omit<HRPolicy, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'orgId'> & { status?: HRPolicy['status'] },
  ): Promise<HRPolicy> {
    const data = mapDomainHRPolicyToPrismaCreate(orgId, { ...input, status: input.status ?? 'draft' });
    const rec = await this.prisma.hRPolicy.create({ data });
    if (rec.orgId !== orgId) {
      throw new AuthorizationError('Cross-tenant policy creation mismatch', { orgId });
    }

    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_HR_POLICIES]);
    return mapPrismaHRPolicyToDomain(rec);
  }

  async updatePolicy(
    orgId: string,
    policyId: string,
    updates: Partial<Pick<HRPolicy, 'title' | 'content' | 'category' | 'version' | 'effectiveDate' | 'expiryDate' | 'applicableRoles' | 'applicableDepartments' | 'requiresAcknowledgment' | 'status' | 'dataClassification' | 'residencyTag' | 'metadata'>>,
  ): Promise<HRPolicy> {
    const data = mapDomainHRPolicyToPrismaUpdate(updates);
    const updated = await this.prisma.hRPolicy.updateMany({ where: { id: policyId, orgId }, data });

    if (updated.count !== 1) {
      throw new AuthorizationError('Cross-tenant policy update mismatch', { orgId, policyId });
    }

    const rec = await this.prisma.hRPolicy.findFirst({ where: { id: policyId, orgId } });
    if (!rec) {
      throw new AuthorizationError('Cross-tenant policy update mismatch', { orgId, policyId });
    }

    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_HR_POLICIES]);

    return mapPrismaHRPolicyToDomain(rec);
  }

  async getPolicy(orgId: string, policyId: string): Promise<HRPolicy | null> {
    registerOrgCacheTag(
      orgId,
      CACHE_SCOPE_HR_POLICIES,
      PrismaHRPolicyRepository.DEFAULT_CLASSIFICATION,
      PrismaHRPolicyRepository.DEFAULT_RESIDENCY,
    );
    const rec = await this.prisma.hRPolicy.findFirst({ where: { id: policyId, orgId } });
    return rec ? mapPrismaHRPolicyToDomain(rec) : null;
  }

  async listPolicies(orgId: string, filters?: { status?: string; category?: HRPolicy['category'] }): Promise<HRPolicy[]> {
    registerOrgCacheTag(
      orgId,
      CACHE_SCOPE_HR_POLICIES,
      PrismaHRPolicyRepository.DEFAULT_CLASSIFICATION,
      PrismaHRPolicyRepository.DEFAULT_RESIDENCY,
    );
    const where: Prisma.HRPolicyWhereInput = { orgId };
    if (filters?.status) { where.status = filters.status; }
    if (filters?.category) { where.category = filters.category; }
    const recs = await this.prisma.hRPolicy.findMany({ where, orderBy: { effectiveDate: 'desc' } });
    return recs.map(mapPrismaHRPolicyToDomain);
  }
}
