import { z } from 'zod';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import { assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import { AuthorizationError } from '@/server/errors';
import { registerLeaveCacheScopes } from '@/server/use-cases/hr/leave/shared/cache-helpers';

export const listLeavePoliciesInputSchema = z.object({
    orgId: z.uuid(),
});

export type ListLeavePoliciesInput = z.infer<typeof listLeavePoliciesInputSchema>;

export interface ListLeavePoliciesDependencies {
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface ListLeavePoliciesRequest {
    authorization: RepositoryAuthorizationContext;
    payload: ListLeavePoliciesInput;
}

export interface ListLeavePoliciesResult {
    policies: LeavePolicy[];
}

export async function listLeavePolicies(
    deps: ListLeavePoliciesDependencies,
    request: ListLeavePoliciesRequest,
): Promise<ListLeavePoliciesResult> {
    assertPrivilegedOrgPolicyActor(request.authorization);

    if (request.payload.orgId !== request.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant leave policy operation denied.');
    }

    registerLeaveCacheScopes(request.authorization, 'policies');

    const policies = await deps.leavePolicyRepository.getLeavePoliciesByOrganization(
        request.authorization.tenantScope,
    );

    return { policies };
}
