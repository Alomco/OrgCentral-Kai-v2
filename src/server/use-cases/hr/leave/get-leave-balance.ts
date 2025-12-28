import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveBalance } from '@/server/types/leave-types';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { registerLeaveCacheScopes } from './shared';

export interface GetLeaveBalanceDependencies {
    leaveBalanceRepository: ILeaveBalanceRepository;
}

export interface GetLeaveBalanceInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
    year?: number;
}

export interface GetLeaveBalanceResult {
    balances: LeaveBalance[];
    employeeId: string;
    year?: number;
}

export async function getLeaveBalance(
    deps: GetLeaveBalanceDependencies,
    input: GetLeaveBalanceInput,
): Promise<GetLeaveBalanceResult> {
    assertNonEmpty(input.employeeId, 'Employee ID');

    registerLeaveCacheScopes(input.authorization, 'balances');

    const balances = input.year
        ? await deps.leaveBalanceRepository.getLeaveBalancesByEmployeeAndYear(
            input.authorization.tenantScope,
            input.employeeId,
            input.year,
        )
        : await deps.leaveBalanceRepository.getLeaveBalancesByEmployee(
            input.authorization.tenantScope,
            input.employeeId,
        );

    return {
        balances,
        employeeId: input.employeeId,
        year: input.year,
    };
}
