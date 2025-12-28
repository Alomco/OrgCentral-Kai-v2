import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_LEAVE_POLICIES } from '@/server/repositories/cache-scopes';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';

export interface LeavePolicyResolverDependencies {
    leavePolicyRepository: ILeavePolicyRepository;
}

export async function resolveLeavePolicyId(
    { leavePolicyRepository }: LeavePolicyResolverDependencies,
    tenant: TenantScope,
    leaveType: string,
): Promise<string> {
    const existingPolicy = await leavePolicyRepository.getLeavePolicyByName(tenant, leaveType);
    if (existingPolicy) {
        return existingPolicy.id;
    }

    await leavePolicyRepository.createLeavePolicy(tenant, buildDefaultPolicy(tenant, leaveType));
    await invalidateOrgCache(tenant.orgId, CACHE_SCOPE_LEAVE_POLICIES, tenant.dataClassification, tenant.dataResidency);

    const createdPolicy = await leavePolicyRepository.getLeavePolicyByName(tenant, leaveType);
    if (!createdPolicy) {
        throw new Error('Failed to resolve leave policy');
    }

    return createdPolicy.id;
}

function buildDefaultPolicy(tenant: TenantScope, leaveType: string): Omit<LeavePolicy, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date().toISOString();
    return {
        orgId: tenant.orgId,
        dataResidency: tenant.dataResidency,
        dataClassification: tenant.dataClassification,
        auditSource: tenant.auditSource,
        auditBatchId: tenant.auditBatchId,
        name: leaveType,
        policyType: 'SPECIAL',
        accrualFrequency: 'NONE',
        accrualAmount: 0,
        carryOverLimit: undefined,
        requiresApproval: true,
        isDefault: false,
        activeFrom: now,
        activeTo: undefined,
        statutoryCompliance: false,
        maxConsecutiveDays: null,
        allowNegativeBalance: false,
        metadata: { createdFromLeaveService: true },
    };
}
