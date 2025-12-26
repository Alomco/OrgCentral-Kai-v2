import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_HR_POLICIES, CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS } from '@/server/repositories/cache-scopes';
import type { IHRPolicyRepository } from '@/server/repositories/contracts/hr/policies/hr-policy-repository-contract';
import type { IPolicyAcknowledgmentRepository } from '@/server/repositories/contracts/hr/policies/policy-acknowledgment-repository-contract';
import { PrismaHRPolicyRepository } from '@/server/repositories/prisma/hr/policies/prisma-hr-policy-repository';
import { PrismaPolicyAcknowledgmentRepository } from '@/server/repositories/prisma/hr/policies/prisma-policy-acknowledgment-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PolicyAcknowledgment } from '@/server/types/hr-ops-types';

import { getPolicyAcknowledgment } from './get-policy-acknowledgment';

export interface GetPolicyAcknowledgmentForUiInput {
    authorization: RepositoryAuthorizationContext;
    policyId: string;
    userId: string;
}

export interface GetPolicyAcknowledgmentForUiResult {
    acknowledgment: PolicyAcknowledgment | null;
}

function resolvePolicyRepository(): IHRPolicyRepository {
    return new PrismaHRPolicyRepository();
}

function resolveAcknowledgmentRepository(): IPolicyAcknowledgmentRepository {
    return new PrismaPolicyAcknowledgmentRepository();
}

export async function getPolicyAcknowledgmentForUi(
    input: GetPolicyAcknowledgmentForUiInput,
): Promise<GetPolicyAcknowledgmentForUiResult> {
    async function getAcknowledgmentCached(
        cachedInput: GetPolicyAcknowledgmentForUiInput,
    ): Promise<GetPolicyAcknowledgmentForUiResult> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_HR_POLICIES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );
        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_HR_POLICY_ACKNOWLEDGMENTS,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        const acknowledgment = await getPolicyAcknowledgment(
            {
                policyRepository: resolvePolicyRepository(),
                acknowledgmentRepository: resolveAcknowledgmentRepository(),
            },
            {
                authorization: cachedInput.authorization,
                policyId: cachedInput.policyId,
                userId: cachedInput.userId,
            },
        );

        return { acknowledgment };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const acknowledgment = await getPolicyAcknowledgment(
            {
                policyRepository: resolvePolicyRepository(),
                acknowledgmentRepository: resolveAcknowledgmentRepository(),
            },
            { authorization: input.authorization, policyId: input.policyId, userId: input.userId },
        );
        return { acknowledgment };
    }

    return getAcknowledgmentCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
