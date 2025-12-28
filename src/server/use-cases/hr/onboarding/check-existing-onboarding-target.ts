import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { registerPeopleProfilesTag } from '@/server/lib/cache-tags/hr-people';

export interface CheckExistingOnboardingTargetInput {
  authorization: RepositoryAuthorizationContext;
  email: string;
}

export type ExistingOnboardingTargetResult =
  | { exists: false }
  | { exists: true; kind: 'profile'; profileId: string; status?: string | null }
  | { exists: true; kind: 'pending_invitation'; token: string; expiresAt?: Date | null };

export interface CheckExistingOnboardingTargetDependencies {
  profileRepository: IEmployeeProfileRepository;
  invitationRepository: IOnboardingInvitationRepository;
}

export async function checkExistingOnboardingTarget(
  deps: CheckExistingOnboardingTargetDependencies,
  input: CheckExistingOnboardingTargetInput,
): Promise<ExistingOnboardingTargetResult> {
  const email = input.email.trim().toLowerCase();

  const profile = await deps.profileRepository.findByEmail(input.authorization.orgId, email);
  registerPeopleProfilesTag({
    orgId: input.authorization.orgId,
    classification: input.authorization.dataClassification,
    residency: input.authorization.dataResidency,
  });

  if (profile) {
    return {
      exists: true,
      kind: 'profile',
      profileId: profile.id,
      status: (profile.metadata as Record<string, unknown> | null | undefined)?.complianceStatus as string | null,
    };
  }

  const invite = await deps.invitationRepository.getActiveInvitationByEmail(input.authorization.orgId, email);
  registerOrgCacheTag(
    input.authorization.orgId,
    CACHE_SCOPE_ONBOARDING_INVITATIONS,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );

  if (invite) {
    return { exists: true, kind: 'pending_invitation', token: invite.token, expiresAt: invite.expiresAt ?? null };
  }

  return { exists: false };
}
