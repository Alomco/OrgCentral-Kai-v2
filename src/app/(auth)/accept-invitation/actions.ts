'use server';

import { headers as nextHeaders } from 'next/headers';

import { AuthorizationError, ValidationError } from '@/server/errors';
import { auth } from '@/server/lib/auth';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';
import { acceptInvitationController } from '@/server/api-adapters/auth/accept-invitation';
import { completeOnboardingInviteController } from '@/server/api-adapters/hr/onboarding/complete-onboarding-invite';

import type { AcceptInvitationActionState } from './accept-invitation.state';

export async function acceptInvitationAction(
    _previous: AcceptInvitationActionState,
    formData: FormData,
): Promise<AcceptInvitationActionState> {
    void _previous;

    try {
        const token = resolveToken(formData);
        const headerStore = await nextHeaders();
        const session = await auth.api.getSession({ headers: headerStore });
        const actor = requireSessionUser(session);
        if (!actor.email) {
            throw new AuthorizationError('Authenticated email address is required to accept invitations.');
        }

        const invitationRepository = new PrismaInvitationRepository();
        const invitation = await invitationRepository.findByToken(token);
        if (!invitation) {
            throw new ValidationError('Invitation not found.');
        }

        const useOnboardingFlow = shouldUseOnboardingFlow(invitation.onboardingData);
        const result = useOnboardingFlow
            ? await completeOnboardingInviteController({ inviteToken: token }, actor)
            : await acceptInvitationController({ token }, actor);

        return {
            status: 'success',
            organizationName: result.organizationName,
            alreadyMember: result.alreadyMember,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to accept invitation.',
        };
    }
}

function resolveToken(formData: FormData): string {
    const value = formData.get('token');
    if (typeof value !== 'string') {
        throw new ValidationError('Invitation token is required.');
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new ValidationError('Invitation token is required.');
    }
    return trimmed;
}

function shouldUseOnboardingFlow(payload: {
    employeeId?: string;
    employeeNumber?: string;
    onboardingTemplateId?: string | null;
}): boolean {
    return (
        (typeof payload.employeeId === 'string' && payload.employeeId.trim().length > 0) ||
        (typeof payload.employeeNumber === 'string' && payload.employeeNumber.trim().length > 0) ||
        (typeof payload.onboardingTemplateId === 'string' && payload.onboardingTemplateId.trim().length > 0)
    );
}
