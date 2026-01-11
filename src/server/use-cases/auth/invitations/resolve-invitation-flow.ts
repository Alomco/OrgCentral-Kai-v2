import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import { createInvitationRepository } from '@/server/repositories/providers/auth/invitation-repository-provider';

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
    const payload = invitation.onboardingData;
    if (!payload || typeof payload !== 'object') {
        return false;
    }

    const employeeId = 'employeeId' in payload ? payload.employeeId : undefined;
    const onboardingTemplateId = 'onboardingTemplateId' in payload ? payload.onboardingTemplateId : undefined;

    const hasEmployeeId = typeof employeeId === 'string' && employeeId.trim().length > 0;
    const hasTemplateId = typeof onboardingTemplateId === 'string' && onboardingTemplateId.trim().length > 0;

    return hasEmployeeId || hasTemplateId;
}
