import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    deliverInvitationEmail,
    type InvitationEmailDependencies,
    type InvitationEmailResult,
} from './invitation-email.helpers';

export interface SendInvitationEmailInput {
    authorization: RepositoryAuthorizationContext;
    invitationToken: string;
    invitationUrl?: string;
    inviterDisplayName?: string;
}

export type SendInvitationEmailDependencies = InvitationEmailDependencies;

export type SendInvitationEmailResult = InvitationEmailResult;

export async function sendInvitationEmail(
    dependencies: SendInvitationEmailDependencies,
    input: SendInvitationEmailInput,
): Promise<SendInvitationEmailResult> {
    return deliverInvitationEmail(dependencies, {
        ...input,
        mode: 'initial',
    });
}
