import type { ILeaveBalanceRepository, LeaveBalanceCreateInput } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveBalance } from '@/server/types/leave-types';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { invalidateLeaveCacheScopes } from './shared';
import { resolveLeavePolicyId } from './utils/resolve-leave-policy';

export interface CreateLeaveBalanceDependencies {
    leaveBalanceRepository: ILeaveBalanceRepository;
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface CreateLeaveBalanceInput {
    authorization: RepositoryAuthorizationContext;
    balance: Omit<
        LeaveBalance,
        'createdAt' | 'updatedAt' | 'orgId' | 'dataResidency' | 'dataClassification' | 'auditSource' | 'auditBatchId'
    >;
}

export interface CreateLeaveBalanceResult {
    success: true;
    balanceId: string;
    policyId: string;
}

export async function createLeaveBalanceWithPolicy(
    { leaveBalanceRepository, leavePolicyRepository }: CreateLeaveBalanceDependencies,
    { authorization, balance }: CreateLeaveBalanceInput,
): Promise<CreateLeaveBalanceResult> {
    assertNonEmpty(balance.id, 'Leave balance ID');
    assertNonEmpty(balance.employeeId, 'Employee ID');
    assertNonEmpty(balance.leaveType, 'Leave type');

    const policyId = await resolveLeavePolicyId(
        { leavePolicyRepository },
        authorization.tenantScope,
        balance.leaveType,
    );

    const balancePayload: LeaveBalanceCreateInput = {
        ...balance,
        orgId: authorization.orgId,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        auditBatchId: authorization.auditBatchId,
        policyId,
    };

    await leaveBalanceRepository.createLeaveBalance(authorization.tenantScope, balancePayload);
    await invalidateLeaveCacheScopes(authorization, 'balances');

    return {
        success: true,
        balanceId: balancePayload.id,
        policyId,
    };
}
