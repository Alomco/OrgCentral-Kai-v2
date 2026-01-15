'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';
import {
    getInvitationDeliveryFailureMessage,
    isInvitationDeliverySuccessful,
} from '@/server/use-cases/notifications/invitation-email.helpers';
import { sendInvitationEmail } from '@/server/use-cases/notifications/send-invitation-email';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';
import { type InviteMemberActionState } from './shared';

const inviteMemberSchema = z
    .object({
        email: z.email(),
        role: z.string().trim().min(1),
    })
    .strict();

export async function inviteMemberAction(
    _previous: InviteMemberActionState,
    formData: FormData,
): Promise<InviteMemberActionState> {
    void _previous;
    const headerStore = await headers();

    const parsed = inviteMemberSchema.safeParse({
        email: formData.get('email') ?? '',
        role: formData.get('role') ?? '',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid invitation input.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { member: ['invite'] },
            auditSource: 'ui:org-members:invite',
            action: 'invite',
            resourceType: 'org.invitation',
            resourceAttributes: {
                email: parsed.data.email,
                role: parsed.data.role,
            },
        },
    );

    try {
        const inviteResultSchema = z
            .object({
                token: z.string().trim().min(1),
                alreadyInvited: z.boolean(),
            })
            .strict();

        const getMembershipServiceTyped = getMembershipService as () => {
            inviteMember(input: {
                authorization: RepositoryAuthorizationContext;
                email: string;
                roles: string[];
                request?: {
                    ipAddress?: string;
                    userAgent?: string;
                    securityContext?: Record<string, unknown>;
                };
            }): Promise<{ token: string; alreadyInvited: boolean }>;
        };
        const membershipService = getMembershipServiceTyped();
        const requestContext = buildInvitationRequestSecurityContext({
            authorization,
            headers: headerStore,
            action: 'org.invitation.create',
            targetEmail: parsed.data.email,
        });
        const result = inviteResultSchema.parse(
            await membershipService.inviteMember({
                authorization,
                email: parsed.data.email,
                roles: [parsed.data.role],
                request: requestContext,
            }),
        );

        let message = result.alreadyInvited
            ? 'An active invitation already exists for this email.'
            : 'Invitation created.';
        if (!result.alreadyInvited) {
            try {
                const dependencies = getInvitationEmailDependencies();
                const emailResult = await sendInvitationEmail(dependencies, {
                    authorization,
                    invitationToken: result.token,
                });
                if (!isInvitationDeliverySuccessful(emailResult.delivery)) {
                    message = `Invitation created. ${getInvitationDeliveryFailureMessage(emailResult.delivery)} Share the invite link with the recipient.`;
                }
            } catch {
                message = 'Invitation created. Invitation email could not be delivered. Share the invite link with the recipient.';
            }
        }

        return {
            status: 'success',
            message,
            token: result.token,
            alreadyInvited: result.alreadyInvited,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to invite member.',
        };
    }
}
