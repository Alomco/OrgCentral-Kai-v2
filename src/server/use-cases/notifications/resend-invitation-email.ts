import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    deliverInvitationEmail,
    type InvitationEmailDependencies,
    type InvitationEmailResult,
} from './invitation-email.helpers';

export interface ResendInvitationEmailInput {
    authorization: RepositoryAuthorizationContext;
    invitationToken: string;
    invitationUrl?: string;
    inviterDisplayName?: string;
}

export type ResendInvitationEmailDependencies = InvitationEmailDependencies;

export type ResendInvitationEmailResult = InvitationEmailResult;

export async function resendInvitationEmail(
    dependencies: ResendInvitationEmailDependencies,
    input: ResendInvitationEmailInput,
): Promise<ResendInvitationEmailResult> {
    return deliverInvitationEmail(dependencies, {
        ...input,
        mode: 'resend',
    });
}
