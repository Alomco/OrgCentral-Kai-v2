'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { resendInvitation } from '@/server/services/org/invitations/invitation-service';
import {
    getInvitationDeliveryFailureMessage,
    isInvitationDeliverySuccessful,
} from '@/server/use-cases/notifications/invitation-email.helpers';
import type { ResendOrgInvitationActionState } from './invitation-actions.types';

const payloadSchema = z.object({
    token: z.string().trim().min(1, 'Invitation token is required.'),
});

export async function resendOrgInvitationAction(
    _previous: ResendOrgInvitationActionState,
    formData: FormData,
): Promise<ResendOrgInvitationActionState> {
    void _previous;

    const parsed = payloadSchema.safeParse({
        token: formData.get('token'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid invitation request.' };
    }

    try {
        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { member: ['invite'] },
                auditSource: 'ui:org-members:invitation:resend',
                resourceType: 'org.invitation',
                action: 'resend',
                resourceAttributes: { token: parsed.data.token },
            },
        );

        const result = await resendInvitation(
            authorization,
            parsed.data.token,
        );

        if (!isInvitationDeliverySuccessful(result.delivery)) {
            return {
                status: 'error',
                message: getInvitationDeliveryFailureMessage(result.delivery),
            };
        }

        return { status: 'success', message: 'Invitation resent.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to resend invitation.';
        return { status: 'error', message };
    }
}
