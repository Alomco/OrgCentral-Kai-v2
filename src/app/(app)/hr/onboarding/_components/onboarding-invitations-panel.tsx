import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getOnboardingInvitationsForUi } from '@/server/use-cases/hr/onboarding/invitations/get-onboarding-invitations.cached';

import { ONBOARDING_INVITATIONS_LIMIT } from '../onboarding-invitations-query';
import { OnboardingInvitationsClient } from './onboarding-invitations-client';

export interface OnboardingInvitationsPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function OnboardingInvitationsPanel({ authorization }: OnboardingInvitationsPanelProps) {
    const result = await getOnboardingInvitationsForUi({ authorization, limit: ONBOARDING_INVITATIONS_LIMIT });

    return <OnboardingInvitationsClient initialInvitations={result.invitations} />;
}
