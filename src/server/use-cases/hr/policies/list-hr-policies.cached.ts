import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_HR_POLICIES } from '@/server/repositories/cache-scopes';
import type { IHRPolicyRepository } from '@/server/repositories/contracts/hr/policies/hr-policy-repository-contract';
import { PrismaHRPolicyRepository } from '@/server/repositories/prisma/hr/policies/prisma-hr-policy-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { listHrPolicies } from './list-hr-policies';

export interface ListHrPoliciesForUiInput {
    authorization: RepositoryAuthorizationContext;
    filters?: Parameters<IHRPolicyRepository['listPolicies']>[1];
}

export interface ListHrPoliciesForUiResult {
    policies: HRPolicy[];
}

function resolvePolicyRepository(): IHRPolicyRepository {
    return new PrismaHRPolicyRepository();
}

export async function listHrPoliciesForUi(
    input: ListHrPoliciesForUiInput,
): Promise<ListHrPoliciesForUiResult> {
    async function listPoliciesCached(
        cachedInput: ListHrPoliciesForUiInput,
    ): Promise<ListHrPoliciesForUiResult> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_HR_POLICIES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        const policies = await listHrPolicies(
            { policyRepository: resolvePolicyRepository() },
            { authorization: cachedInput.authorization, filters: cachedInput.filters },
        );

        return { policies };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const policies = await listHrPolicies(
            { policyRepository: resolvePolicyRepository() },
            { authorization: input.authorization, filters: input.filters },
        );
        return { policies };
    }

    return listPoliciesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
