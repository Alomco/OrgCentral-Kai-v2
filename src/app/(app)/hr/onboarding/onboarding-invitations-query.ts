import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { listOnboardingInvitationsAction } from './actions/onboarding-invitations';

export const ONBOARDING_INVITATIONS_QUERY_KEY = ['hr', 'onboarding', 'invitations'] as const;
export const ONBOARDING_INVITATIONS_LIMIT = 25;

export function invitationsKey(limit?: number) {
  return [...ONBOARDING_INVITATIONS_QUERY_KEY, String(limit ?? ONBOARDING_INVITATIONS_LIMIT)] as const;
}

export async function fetchOnboardingInvitations(limit?: number): Promise<OnboardingInvitation[]> {
  const result = await listOnboardingInvitationsAction(limit ?? ONBOARDING_INVITATIONS_LIMIT);
  return result.invitations;
}
