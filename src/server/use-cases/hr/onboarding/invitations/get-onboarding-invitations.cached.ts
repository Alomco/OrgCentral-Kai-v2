import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import type { IOnboardingInvitationRepository, OnboardingInvitation, OnboardingInvitationStatus } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { listOnboardingInvitations } from './list-onboarding-invitations';

export interface GetOnboardingInvitationsForUiInput {
    authorization: RepositoryAuthorizationContext;
    status?: OnboardingInvitationStatus;
    limit?: number;
}

export interface GetOnboardingInvitationsForUiResult {
    invitations: OnboardingInvitation[];
}

function resolveInvitationRepository(): IOnboardingInvitationRepository {
    return new PrismaOnboardingInvitationRepository();
}

export async function getOnboardingInvitationsForUi(
    input: GetOnboardingInvitationsForUiInput,
): Promise<GetOnboardingInvitationsForUiResult> {
    async function getInvitationsCached(
        cachedInput: GetOnboardingInvitationsForUiInput,
    ): Promise<GetOnboardingInvitationsForUiResult> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        return listOnboardingInvitations(
            { onboardingInvitationRepository: resolveInvitationRepository() },
            cachedInput,
        );
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return listOnboardingInvitations(
            { onboardingInvitationRepository: resolveInvitationRepository() },
            input,
        );
    }

    return getInvitationsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
