import { z } from 'zod';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import type { MembershipService } from '@/server/services/org/membership/membership-service';
import type { AcceptInvitationResult } from '@/server/use-cases/auth/accept-invitation';
import { processInvitationAcceptance } from '@/server/use-cases/auth/accept-invitation-action';
import { extractIpAddress, extractUserAgent } from '@/server/use-cases/shared/request-metadata';

const AcceptInvitationPayloadSchema = z.object({
    token: z.string().min(1, 'An invitation token is required'),
});

const AcceptInvitationActorSchema = z.object({
    userId: z.string().min(1, 'Authenticated user id is required'),
    email: z.email({ message: 'Authenticated user email is required' }),
});

const membershipService = getMembershipService();

export type AcceptInvitationPayload = z.infer<typeof AcceptInvitationPayloadSchema>;
export type AcceptInvitationActor = z.infer<typeof AcceptInvitationActorSchema>;

export async function acceptInvitationController(
    payload: unknown,
    actor: unknown,
    requestHeaders?: Headers,
    service: MembershipService = membershipService,
): Promise<AcceptInvitationResult> {
    const { token } = AcceptInvitationPayloadSchema.parse(payload);
    const actorContext = AcceptInvitationActorSchema.parse(actor);
    return processInvitationAcceptance(
        {
            token,
            actor: actorContext,
            request: requestHeaders
                ? {
                    ipAddress: extractIpAddress(requestHeaders),
                    userAgent: extractUserAgent(requestHeaders),
                }
                : undefined,
        },
        { service },
    );
}
