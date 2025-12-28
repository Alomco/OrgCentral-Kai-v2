import type { ILeaveBalanceRepository, LeaveBalanceCreateInput } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { randomUUID } from 'node:crypto';
import { invalidateLeaveCacheScopes, type LeaveCacheScopeKey } from './shared/cache-helpers';

export interface EnsureEmployeeBalancesDependencies {
    leaveBalanceRepository: ILeaveBalanceRepository;
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface EnsureEmployeeBalancesInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
    year: number;
    leaveTypes: string[];
}

export interface EnsureEmployeeBalancesResult {
    success: true;
    employeeId: string;
    year: number;
    ensuredBalances: number;
}

export async function ensureEmployeeBalances(
    deps: EnsureEmployeeBalancesDependencies,
    input: EnsureEmployeeBalancesInput,
): Promise<EnsureEmployeeBalancesResult> {
    assertNonEmpty(input.employeeId, 'Employee ID');

    const existingBalances = await deps.leaveBalanceRepository.getLeaveBalancesByEmployeeAndYear(
        input.authorization.tenantScope,
        input.employeeId,
        input.year,
    );

    const existingLeaveTypes = new Set(existingBalances.map((b) => b.leaveType));
    const missingLeaveTypes = input.leaveTypes.filter((type) => !existingLeaveTypes.has(type));

    let ensuredCount = 0;

    if (missingLeaveTypes.length === 0) {
        return {
            success: true,
            employeeId: input.employeeId,
            year: input.year,
            ensuredBalances: 0,
        };
    }

    // Fetch all policies once
    const policies = await deps.leavePolicyRepository.getLeavePoliciesByOrganization(
        input.authorization.tenantScope,
    );

    for (const leaveType of missingLeaveTypes) {
        // Match policy by policyType (maps to leave type code)
        // LeavePolicy.policyType should match the leaveType string
        const policy = policies.find((p) => p.policyType === leaveType.toUpperCase() || p.name === leaveType);
        if (!policy) {
            // Skip if no matching policy exists
            continue;
        }

        // Default entitlement is accrualAmount (or 0 if not set)
        const defaultEntitlement = policy.accrualAmount ?? 0;

        const balancePayload: LeaveBalanceCreateInput = {
            id: randomUUID(),
            orgId: input.authorization.orgId,
            dataResidency: input.authorization.dataResidency,
            dataClassification: input.authorization.dataClassification,
            auditSource: input.authorization.auditSource,
            auditBatchId: input.authorization.auditBatchId,
            employeeId: input.employeeId,
            leaveType,
            year: input.year,
            totalEntitlement: defaultEntitlement,
            used: 0,
            pending: 0,
            available: defaultEntitlement,
            policyId: policy.id,
        };

        await deps.leaveBalanceRepository.createLeaveBalance(
            input.authorization.tenantScope,
            balancePayload,
        );

        ensuredCount++;
    }

    if (ensuredCount > 0) {
        const balanceScope: LeaveCacheScopeKey = 'balances';
        await invalidateLeaveCacheScopes(input.authorization, balanceScope);
    }

    return {
        success: true,
        employeeId: input.employeeId,
        year: input.year,
        ensuredBalances: ensuredCount,
    };
}
