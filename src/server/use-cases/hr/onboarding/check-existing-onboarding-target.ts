import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { registerPeopleProfilesTag } from '@/server/lib/cache-tags/hr-people';

export interface CheckExistingOnboardingTargetInput {
  authorization: RepositoryAuthorizationContext;
  email: string;
  employeeNumber?: string;
}

export type ExistingOnboardingTargetResult =
  | { exists: false }
  | { exists: true; kind: 'profile'; profileId: string; status?: string | null }
  | { exists: true; kind: 'pending_invitation'; token: string; expiresAt?: Date | null }
  | { exists: true; kind: 'auth_user'; userId?: string };

export interface CheckExistingOnboardingTargetDependencies {
  profileRepository: IEmployeeProfileRepository;
  invitationRepository: IOnboardingInvitationRepository;
  userRepository?: IUserRepository;
}

export async function checkExistingOnboardingTarget(
  deps: CheckExistingOnboardingTargetDependencies,
  input: CheckExistingOnboardingTargetInput,
): Promise<ExistingOnboardingTargetResult> {
  const email = input.email.trim().toLowerCase();
  const employeeNumber = input.employeeNumber?.trim();

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

  if (deps.userRepository) {
    const existingUser = await deps.userRepository.findByEmail(email);
    if (existingUser) {
      return { exists: true, kind: 'auth_user', userId: existingUser.id };
    }
  }

  if (employeeNumber) {
    const profileByNumber = await deps.profileRepository.findByEmployeeNumber(
      input.authorization.orgId,
      employeeNumber,
    );

    if (profileByNumber) {
      return {
        exists: true,
        kind: 'profile',
        profileId: profileByNumber.id,
        status: (profileByNumber.metadata as Record<string, unknown> | null | undefined)?.complianceStatus as
          | string
          | null,
      };
    }

    const pendingInvitations = await deps.invitationRepository.listInvitationsByOrg(
      input.authorization.orgId,
      { status: 'pending' },
    );
    registerOrgCacheTag(
      input.authorization.orgId,
      CACHE_SCOPE_ONBOARDING_INVITATIONS,
      input.authorization.dataClassification,
      input.authorization.dataResidency,
    );

    const matchedInvite = pendingInvitations.find(
      (candidate) => candidate.onboardingData.employeeId?.trim() === employeeNumber,
    );

    if (matchedInvite) {
      return {
        exists: true,
        kind: 'pending_invitation',
        token: matchedInvite.token,
        expiresAt: matchedInvite.expiresAt ?? null,
      };
    }
  }

  return { exists: false };
}
