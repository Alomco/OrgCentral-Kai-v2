import type { ErrorDetails } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    getInvitationDeliveryFailureMessage,
    isInvitationDeliverySuccessful,
} from '@/server/use-cases/notifications/invitation-email.helpers';
import { resendInvitationEmail } from '@/server/use-cases/notifications/resend-invitation-email';
import { sendInvitationEmail } from '@/server/use-cases/notifications/send-invitation-email';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';

interface PendingInvitationDetails {
    kind: 'pending_invitation';
    token: string;
}

export interface InvitationEmailFeedback {
    message: string;
    invitationUrl?: string;
    emailDelivered?: boolean;
}

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function readPendingInvitationToken(details?: ErrorDetails): string | null {
    const candidate = details as PendingInvitationDetails | undefined;
    if (candidate?.kind === 'pending_invitation' && candidate.token.trim().length > 0) {
        return candidate.token;
    }
    return null;
}

export async function buildSendInviteFeedback(
    authorization: RepositoryAuthorizationContext,
    token: string,
): Promise<InvitationEmailFeedback> {
    try {
        const dependencies = getInvitationEmailDependencies();
        const emailResult = await sendInvitationEmail(dependencies, {
            authorization,
            invitationToken: token,
        });

        const delivered = isInvitationDeliverySuccessful(emailResult.delivery);
        return {
            message: delivered
                ? 'Invitation created. Email sent.'
                : `Invitation created, but email delivery failed. ${getInvitationDeliveryFailureMessage(emailResult.delivery)} Share the invite link with the employee.`,
            invitationUrl: emailResult.invitationUrl,
            emailDelivered: delivered,
        };
    } catch {
        return {
            message: 'Invitation created, but email delivery failed (unexpected error). Share the invite link with the employee.',
            emailDelivered: false,
        };
    }
}

export async function buildResendInviteFeedback(
    authorization: RepositoryAuthorizationContext,
    token: string,
): Promise<InvitationEmailFeedback> {
    try {
        const dependencies = getInvitationEmailDependencies();
        const resendResult = await resendInvitationEmail(dependencies, {
            authorization,
            invitationToken: token,
        });

        const delivered = isInvitationDeliverySuccessful(resendResult.delivery);
        return {
            message: delivered
                ? 'Invitation already exists. Email resent.'
                : `Invitation already exists, but resend delivery failed. ${getInvitationDeliveryFailureMessage(resendResult.delivery)} Share the invite link with the employee.`,
            invitationUrl: resendResult.invitationUrl,
            emailDelivered: delivered,
        };
    } catch {
        return {
            message: 'Invitation already exists, but resend delivery failed (unexpected error). Share the invite link with the employee.',
            emailDelivered: false,
        };
    }
}
