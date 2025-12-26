import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { AbacPolicy } from '@/server/security/abac-types';
import { normalizeAbacPolicies } from '@/server/security/abac-policy-normalizer';
import { ValidationError } from '@/server/errors';

// Use-case: set ABAC policies for an organization through ABAC policy repositories with authorization.

const MAX_POLICIES = 200;

export interface SetAbacPoliciesDependencies {
    policyRepository: IAbacPolicyRepository;
}

export interface SetAbacPoliciesInput {
    authorization: RepositoryAuthorizationContext;
    policies: AbacPolicy[];
}

export interface SetAbacPoliciesResult {
    policies: AbacPolicy[];
}

export async function setAbacPolicies(
    deps: SetAbacPoliciesDependencies,
    input: SetAbacPoliciesInput,
): Promise<SetAbacPoliciesResult> {
    if (input.policies.length > MAX_POLICIES) {
        throw new ValidationError(`Policy set exceeds maximum of ${String(MAX_POLICIES)} entries.`);
    }

    const normalized = normalizeAbacPolicies(input.policies, { assumeValidated: true });

    await deps.policyRepository.setPoliciesForOrg(input.authorization.orgId, normalized);

    return { policies: normalized };
}
