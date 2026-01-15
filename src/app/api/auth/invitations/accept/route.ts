import { NextResponse } from 'next/server';
import { completeOnboardingInviteController } from '@/server/api-adapters/hr/onboarding/complete-onboarding-invite';
import { acceptInvitationController } from '@/server/api-adapters/auth/accept-invitation';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { AuthorizationError } from '@/server/errors';
import { auth, type AuthSession } from '@/server/lib/auth';
import { shouldUseOnboardingFlow } from '@/server/use-cases/auth/invitations/resolve-invitation-flow';
import { z } from 'zod';

const requestSchema = z
    .union([
        z.object({ token: z.string().trim().min(1) }),
        z.object({ inviteToken: z.string().trim().min(1) }),
    ])
    .transform((value) => ('token' in value ? value.token : value.inviteToken));

function requireActor(session: AuthSession | null): { userId: string; email: string } {
    const { userId, email } = requireSessionUser(session);
    if (!email) {
        throw new AuthorizationError('Authenticated email address is required to accept invitations.');
    }

    return { userId, email };
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const token = requestSchema.parse(await request.json());
        const session = await auth.api.getSession({ headers: request.headers });
        const actor = requireActor(session);
        const useOnboardingFlow = await shouldUseOnboardingFlow(token);
        const result = useOnboardingFlow
            ? await completeOnboardingInviteController({ inviteToken: token }, actor, request.headers)
            : await acceptInvitationController({ token }, actor, request.headers);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
