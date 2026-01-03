import { z } from 'zod';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { TenantScope } from '@/server/types/tenant';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import { assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import { AuthorizationError, EntityNotFoundError } from '@/server/errors';
import { LeavePolicyInUseError } from '@/server/errors/hr-leave-policies';
import { invalidateLeaveCacheScopes } from '@/server/use-cases/hr/leave/shared/cache-helpers';

export const deleteLeavePolicyInputSchema = z.object({
    policyId: z.uuid(),
    orgId: z.uuid(),
});

export type DeleteLeavePolicyInput = z.infer<typeof deleteLeavePolicyInputSchema>;

export interface DeleteLeavePolicyDependencies {
    leavePolicyRepository: ILeavePolicyRepository;
    leaveBalanceRepository: {
        countLeaveBalancesByPolicy(tenant: TenantScope, policyId: string): Promise<number>;
    };
    leaveRequestRepository: {
        countLeaveRequestsByPolicy(tenant: TenantScope, policyId: string): Promise<number>;
    };
}

export interface DeleteLeavePolicyRequest {
    authorization: RepositoryAuthorizationContext;
    payload: DeleteLeavePolicyInput;
}

export interface DeleteLeavePolicyResult {
    success: true;
}

export async function deleteLeavePolicy(
    deps: DeleteLeavePolicyDependencies,
    request: DeleteLeavePolicyRequest,
): Promise<DeleteLeavePolicyResult> {
    assertPrivilegedOrgPolicyActor(request.authorization);

    if (request.payload.orgId !== request.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant leave policy operation denied.');
    }

    const existing = await deps.leavePolicyRepository.getLeavePolicy(
        request.authorization.tenantScope,
        request.payload.policyId,
    );

    if (!existing) {
        throw new EntityNotFoundError('Leave policy', {
            orgId: request.authorization.orgId,
            policyId: request.payload.policyId,
        });
    }

    const [balanceCount, requestCount] = await Promise.all([
        deps.leaveBalanceRepository.countLeaveBalancesByPolicy(
            request.authorization.tenantScope,
            request.payload.policyId,
        ),
        deps.leaveRequestRepository.countLeaveRequestsByPolicy(
            request.authorization.tenantScope,
            request.payload.policyId,
        ),
    ]);

    if (balanceCount > 0 || requestCount > 0) {
        throw new LeavePolicyInUseError({
            orgId: request.authorization.orgId,
            policyId: request.payload.policyId,
            leaveBalances: balanceCount,
            leaveRequests: requestCount,
        });
    }

    await deps.leavePolicyRepository.deleteLeavePolicy(
        request.authorization.tenantScope,
        request.payload.policyId,
    );

    await invalidateLeaveCacheScopes(request.authorization, 'policies');

    return { success: true };
}
