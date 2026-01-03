// Use-case: update an HR policy using HR policy repositories under guard control.
import { EntityNotFoundError } from '@/server/errors';
import type { IHRPolicyRepository } from '@/server/repositories/contracts/hr/policies/hr-policy-repository-contract';
import { RepositoryAuthorizer, type RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import type { HRPolicy } from '@/server/types/hr-ops-types';

export interface UpdateHrPolicyDependencies {
    policyRepository: IHRPolicyRepository;
}

export interface UpdateHrPolicyInput {
    authorization: RepositoryAuthorizationContext;
    policyId: string;
    updates: Parameters<IHRPolicyRepository['updatePolicy']>[2];
}

export async function updateHrPolicy(
    deps: UpdateHrPolicyDependencies,
    input: UpdateHrPolicyInput,
): Promise<HRPolicy> {
    assertPrivilegedOrgPolicyActor(input.authorization);

    const existing = await deps.policyRepository.getPolicy(input.authorization.orgId, input.policyId);
    if (!existing) {
        throw new EntityNotFoundError('HRPolicy', { policyId: input.policyId });
    }

    RepositoryAuthorizer.default().assertTenantRecord(existing, input.authorization);

    const updatedPolicy = await deps.policyRepository.updatePolicy(
        input.authorization.orgId,
        input.policyId,
        input.updates,
    );

    return updatedPolicy;
}
