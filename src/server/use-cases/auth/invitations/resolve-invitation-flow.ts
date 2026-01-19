import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import { createInvitationRepository } from '@/server/repositories/providers/auth/invitation-repository-provider';
import { hasOnboardingFingerprint } from '@/server/invitations/invitation-fingerprint';
import { toInvitationJson } from '@/server/invitations/onboarding-data';

export interface InvitationFlowDependencies {
    invitationRepository: IInvitationRepository;
}

export function buildInvitationFlowDependencies(
    overrides: Partial<InvitationFlowDependencies> = {},
): InvitationFlowDependencies {
    return {
        invitationRepository: overrides.invitationRepository ?? createInvitationRepository(),
    };
}

export async function shouldUseOnboardingFlow(
    token: string,
    overrides: Partial<InvitationFlowDependencies> = {},
): Promise<boolean> {
    const deps = buildInvitationFlowDependencies(overrides);
    const invitation = await deps.invitationRepository.findByToken(token);
    if (!invitation) {
        return false;
    }
    return hasOnboardingData(invitation);
}

function hasOnboardingData(invitation: InvitationRecord): boolean {
    return hasOnboardingFingerprint(toInvitationJson(invitation.onboardingData));
}
