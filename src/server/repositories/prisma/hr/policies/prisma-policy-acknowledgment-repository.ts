import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IPolicyAcknowledgmentRepository } from '@/server/repositories/contracts/hr/policies/policy-acknowledgment-repository-contract';
import { mapDomainPolicyAckToPrismaCreate, mapPrismaPolicyAckToDomain } from '@/server/repositories/mappers/hr/policies/hr-policy-mapper';
import type { PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import { AuthorizationError } from '@/server/errors';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_HR_POLICIES, CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS } from '@/server/repositories/cache-scopes';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export class PrismaPolicyAcknowledgmentRepository extends BasePrismaRepository implements IPolicyAcknowledgmentRepository {
  private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
  private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
  async acknowledgePolicy(orgId: string, input: Omit<PolicyAcknowledgment, 'id'>): Promise<PolicyAcknowledgment> {
    const data = mapDomainPolicyAckToPrismaCreate({ ...input, orgId });
    const rec = await this.prisma.policyAcknowledgment.create({ data });
    if (rec.orgId !== orgId) {
      throw new AuthorizationError('Cross-tenant policy acknowledgment mismatch', { orgId });
    }

    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_HR_POLICIES, CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS]);
    return mapPrismaPolicyAckToDomain(rec);
  }

  async getAcknowledgment(orgId: string, policyId: string, userId: string, version: string): Promise<PolicyAcknowledgment | null> {
    registerOrgCacheTag(
      orgId,
      CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS,
      PrismaPolicyAcknowledgmentRepository.DEFAULT_CLASSIFICATION,
      PrismaPolicyAcknowledgmentRepository.DEFAULT_RESIDENCY,
    );
    const rec = await this.prisma.policyAcknowledgment.findFirst({ where: { orgId, policyId, userId, version } });
    return rec ? mapPrismaPolicyAckToDomain(rec) : null;
  }

  async listAcknowledgments(orgId: string, policyId: string, version?: string): Promise<PolicyAcknowledgment[]> {
    registerOrgCacheTag(
      orgId,
      CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS,
      PrismaPolicyAcknowledgmentRepository.DEFAULT_CLASSIFICATION,
      PrismaPolicyAcknowledgmentRepository.DEFAULT_RESIDENCY,
    );
    const recs = await this.prisma.policyAcknowledgment.findMany({ where: { orgId, policyId, ...(version ? { version } : {}) }, orderBy: { acknowledgedAt: 'desc' } });
    return recs.map(mapPrismaPolicyAckToDomain);
  }
}
