import { AuthorizationError } from '@/server/errors';
import type {
	IOnboardingInvitationRepository,
	OnboardingInvitation,
	OnboardingInvitationStatus,
} from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

const INVITATION_MANAGER_ROLES = new Set(['orgAdmin', 'owner', 'hr']);

export interface ListOnboardingInvitationsDependencies {
	onboardingInvitationRepository: IOnboardingInvitationRepository;
}

export interface ListOnboardingInvitationsInput {
	authorization: RepositoryAuthorizationContext;
	status?: OnboardingInvitationStatus;
	limit?: number;
}

export interface ListOnboardingInvitationsResult {
	invitations: OnboardingInvitation[];
}

function assertOnboardingInvitationManager(authorization: RepositoryAuthorizationContext): void {
	if (!INVITATION_MANAGER_ROLES.has(authorization.roleKey)) {
		throw new AuthorizationError('You do not have permission to manage onboarding invitations.');
	}
}

export async function listOnboardingInvitations(
	deps: ListOnboardingInvitationsDependencies,
	input: ListOnboardingInvitationsInput,
): Promise<ListOnboardingInvitationsResult> {
	assertOnboardingInvitationManager(input.authorization);

	const invitations = await deps.onboardingInvitationRepository.listInvitationsByOrg(
		input.authorization.orgId,
		{
			status: input.status,
			limit: input.limit,
		},
	);

	return { invitations };
}
