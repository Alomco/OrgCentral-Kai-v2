import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';
import { resolveLeavePolicyId } from '../utils/resolve-leave-policy';
import { normalizeLeaveType } from './sync-leave-accruals.entitlements';

export class PolicyCache {
    private readonly cache = new Map<string, LeavePolicy>();

    private constructor(
        private readonly policyRepository: ILeavePolicyRepository,
        private readonly tenant: TenantScope,
    ) { }

    static async bootstrap(
        policyRepository: ILeavePolicyRepository,
        tenant: TenantScope,
    ): Promise<PolicyCache> {
        const cache = new PolicyCache(policyRepository, tenant);
        await cache.warm();
        return cache;
    }

    async warm(): Promise<void> {
        const policies = await this.policyRepository.getLeavePoliciesByOrganization(this.tenant);
        for (const policy of policies) {
            this.add(policy);
        }
    }

    async resolve(leaveType: string): Promise<LeavePolicy | null> {
        const normalized = normalizeLeaveType(leaveType);
        const cached = this.cache.get(normalized);
        if (cached) {
            return cached;
        }

        const policyId = await resolveLeavePolicyId({ leavePolicyRepository: this.policyRepository }, this.tenant, leaveType);
        const policy = await this.policyRepository.getLeavePolicy(this.tenant, policyId);
        if (policy) {
            this.add(policy);
            return policy;
        }
        return null;
    }

    private add(policy: LeavePolicy): void {
        this.cache.set(normalizeLeaveType(policy.name), policy);
        this.cache.set(normalizeLeaveType(policy.policyType), policy);
    }
}
