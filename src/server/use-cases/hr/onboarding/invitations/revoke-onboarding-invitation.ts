import { ValidationError } from '@/server/errors';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';

export interface RevokeOnboardingInvitationDependencies {
    onboardingInvitationRepository: IOnboardingInvitationRepository;
}

export interface RevokeOnboardingInvitationInput {
    authorization: RepositoryAuthorizationContext;
    token: string;
    revokedByUserId: string;
    reason?: string;
}

export interface RevokeOnboardingInvitationResult {
    success: true;
}

export async function revokeOnboardingInvitation(
    deps: RevokeOnboardingInvitationDependencies,
    input: RevokeOnboardingInvitationInput,
): Promise<RevokeOnboardingInvitationResult> {
    assertNonEmpty(input.token, 'invitation token');
    assertNonEmpty(input.revokedByUserId, 'revokedByUserId');

    if (input.reason && input.reason.length > 500) {
        throw new ValidationError('Revocation reason must be 500 characters or fewer.');
    }

    await deps.onboardingInvitationRepository.revokeInvitation(
        input.authorization.orgId,
        input.token,
        input.revokedByUserId,
        input.reason,
    );

    return { success: true };
}
