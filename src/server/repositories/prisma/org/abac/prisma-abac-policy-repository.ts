import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { getModelDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { AbacPolicy } from '@/server/security/abac-types';
import { normalizeAbacPolicies } from '@/server/security/abac-policy-normalizer';
import type { PrismaInputJsonValue } from '@/server/types/prisma';
import { CACHE_SCOPE_ABAC_POLICIES } from '@/server/repositories/cache-scopes';

export class PrismaAbacPolicyRepository extends BasePrismaRepository implements IAbacPolicyRepository {
  async getPoliciesForOrg(orgId: string): Promise<AbacPolicy[]> {
    return this.runWithTracing('abac.getPoliciesForOrg', async () => {
      const organization = getModelDelegate(this.prisma, 'organization');
      const org = await organization.findUnique({ where: { id: orgId }, select: { settings: true } });
      if (!org) { return []; }

      const settings = org.settings;
      const settingsRecord: Record<string, unknown> =
        settings && typeof settings === 'object' && !Array.isArray(settings)
          ? (settings as Record<string, unknown>)
          : {};

      const abacPolicies = settingsRecord.abacPolicies;
      return normalizeAbacPolicies(Array.isArray(abacPolicies) ? abacPolicies : []);
    }, { orgId });
  }

  async setPoliciesForOrg(orgId: string, policies: AbacPolicy[]): Promise<void> {
    const normalized = normalizeAbacPolicies(policies, { assumeValidated: true });

    await this.runWithTracing('abac.setPoliciesForOrg', async () => {
      await this.prisma.$transaction(async (tx) => {
        const organization = getModelDelegate(tx, 'organization');
        const org = await organization.findUnique({ where: { id: orgId }, select: { settings: true, updatedAt: true } });
        if (!org) { throw new Error('Organization not found'); }

        const settings = org.settings;
        const settingsRecord: Record<string, unknown> =
          settings && typeof settings === 'object' && !Array.isArray(settings)
            ? (settings as Record<string, unknown>)
            : {};

        const updatedSettings = { ...settingsRecord, abacPolicies: normalized };
        const result = await organization.updateMany({
          where: { id: orgId, updatedAt: org.updatedAt },
          data: {
            settings: updatedSettings as unknown as PrismaInputJsonValue,
          },
        });
        if (result.count === 0) {
          throw new Error('ABAC policy update conflict detected. Please retry.');
        }
      });
    }, { orgId, policyCount: policies.length });

    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_ABAC_POLICIES]);
  }
}
