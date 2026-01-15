import { z } from 'zod';
import { AuthorizationError } from '@/server/errors';
import {
    completeOnboardingInvite,
    type CompleteOnboardingInviteDependencies,
    type CompleteOnboardingInviteResult,
} from '@/server/use-cases/hr/onboarding/complete-onboarding-invite';
import { getCompleteOnboardingInviteDependencies } from '@/server/services/hr/onboarding/onboarding-controller-dependencies';
import { extractIpAddress, extractUserAgent } from '@/server/use-cases/shared/request-metadata';

const payloadSchema = z
    .union([
        z.object({ inviteToken: z.string().min(1, 'Invitation token is required') }),
        z.object({ token: z.string().min(1, 'Invitation token is required') }),
    ])
    .transform((value) => ({ inviteToken: 'inviteToken' in value ? value.inviteToken : value.token }));

export interface CompleteOnboardingInvitePayload {
    inviteToken: string;
}

export interface CompleteOnboardingInviteActor {
    userId?: string;
    email?: string;
}

export async function completeOnboardingInviteController(
    payload: unknown,
    actor: CompleteOnboardingInviteActor,
    requestHeaders?: Headers,
    dependencies: CompleteOnboardingInviteDependencies = getCompleteOnboardingInviteDependencies(),
): Promise<CompleteOnboardingInviteResult> {
    const { inviteToken } = payloadSchema.parse(payload);
    const userId = actor.userId?.trim();
    if (!userId) {
        throw new AuthorizationError('Authenticated user id is required to accept onboarding invitations.');
    }
    const email = actor.email?.trim();
    if (!email) {
        throw new AuthorizationError('Authenticated email is required to accept onboarding invitations.');
    }

    const request = requestHeaders
        ? {
            ipAddress: extractIpAddress(requestHeaders),
            userAgent: extractUserAgent(requestHeaders),
        }
        : undefined;

    return completeOnboardingInvite(dependencies, {
        inviteToken,
        userId,
        actorEmail: email,
        request,
    });
}
