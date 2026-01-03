import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { AbacPolicy } from '@/server/security/abac-types';
import { normalizeAbacPolicies } from '@/server/security/abac-policy-normalizer';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ABAC_POLICIES } from '@/server/repositories/cache-scopes';

// Use-case: set ABAC policies for an organization through ABAC policy repositories with authorization.

const MAX_POLICIES = 200;

export interface SetAbacPoliciesDependencies {
    policyRepository: IAbacPolicyRepository;
}

export interface SetAbacPoliciesInput {
    authorization: RepositoryAuthorizationContext;
    policies: AbacPolicy[] | unknown[];
}

export interface SetAbacPoliciesResult {
    policies: AbacPolicy[];
}

export async function setAbacPolicies(
    deps: SetAbacPoliciesDependencies,
    input: SetAbacPoliciesInput,
): Promise<SetAbacPoliciesResult> {
    const candidatePolicies = Array.isArray(input.policies) ? input.policies : [];

    if (candidatePolicies.length > MAX_POLICIES) {
        throw new ValidationError(`Policy set exceeds maximum of ${String(MAX_POLICIES)} entries.`);
    }

    const normalized = normalizeAbacPolicies(candidatePolicies, { failOnInvalid: true });

  await deps.policyRepository.setPoliciesForOrg(input.authorization.orgId, normalized);

  await invalidateOrgCache(
    input.authorization.orgId,
    CACHE_SCOPE_ABAC_POLICIES,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );

  await recordAuditEvent({
    orgId: input.authorization.orgId,
    userId: input.authorization.userId,
    eventType: 'POLICY_CHANGE',
    action: 'abac.set',
    resource: 'org.abac.policy',
    payload: {
      policyCount: normalized.length,
    },
    correlationId: input.authorization.correlationId,
    residencyZone: input.authorization.dataResidency,
    classification: input.authorization.dataClassification,
    auditSource: input.authorization.auditSource,
    auditBatchId: input.authorization.auditBatchId,
  });

  return { policies: normalized };
}
