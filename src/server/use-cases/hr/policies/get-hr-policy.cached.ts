import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_HR_POLICIES } from '@/server/repositories/cache-scopes';
import type { IHRPolicyRepository } from '@/server/repositories/contracts/hr/policies/hr-policy-repository-contract';
import { PrismaHRPolicyRepository } from '@/server/repositories/prisma/hr/policies/prisma-hr-policy-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { getHrPolicy } from './get-hr-policy';

export interface GetHrPolicyForUiInput {
    authorization: RepositoryAuthorizationContext;
    policyId: string;
}

export interface GetHrPolicyForUiResult {
    policy: HRPolicy | null;
}

function resolvePolicyRepository(): IHRPolicyRepository {
    return new PrismaHRPolicyRepository();
}

export async function getHrPolicyForUi(input: GetHrPolicyForUiInput): Promise<GetHrPolicyForUiResult> {
    async function getPolicyCached(cachedInput: GetHrPolicyForUiInput): Promise<GetHrPolicyForUiResult> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_HR_POLICIES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        const policy = await getHrPolicy(
            { policyRepository: resolvePolicyRepository() },
            { authorization: cachedInput.authorization, policyId: cachedInput.policyId },
        );

        return { policy };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const policy = await getHrPolicy(
            { policyRepository: resolvePolicyRepository() },
            { authorization: input.authorization, policyId: input.policyId },
        );
        return { policy };
    }

    return getPolicyCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
