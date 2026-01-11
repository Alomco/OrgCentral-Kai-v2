import { EntityNotFoundError, InfrastructureError, ValidationError } from '@/server/errors';
import type { IInvitationRepository, InvitationRecord } from '@/server/repositories/contracts/auth/invitations';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { resolveAuthBaseURL } from '@/server/lib/auth-environment';
import type {
    NotificationDeliveryAdapter,
    NotificationDeliveryResult,
} from '@/server/services/platform/notifications/notification-types';

export { getInvitationDeliveryFailureMessage } from './invitation-email.failure';

export interface InvitationEmailDependencies {
    invitationRepository: IInvitationRepository;
    deliveryAdapters: NotificationDeliveryAdapter[];
    invitationLinkBuilder?: (token: string) => string;
}

export interface InvitationEmailInput {
    authorization: RepositoryAuthorizationContext;
    invitationToken: string;
    invitationUrl?: string;
    inviterDisplayName?: string;
    mode: 'initial' | 'resend';
}

export interface InvitationEmailResult {
    invitationToken: string;
    invitationUrl: string;
    delivery: NotificationDeliveryResult;
}

export async function deliverInvitationEmail(
    dependencies: InvitationEmailDependencies,
    input: InvitationEmailInput,
): Promise<InvitationEmailResult> {
    const invitation = await dependencies.invitationRepository.findByToken(input.invitationToken.trim());

    if (!invitation || invitation.organizationId !== input.authorization.orgId) {
        throw new EntityNotFoundError('Invitation', {
            token: input.invitationToken,
            orgId: input.authorization.orgId,
        });
    }

    assertInvitationActive(invitation, input.mode);

    const invitationUrl =
        input.invitationUrl ?? buildInvitationUrl(input.invitationToken, dependencies.invitationLinkBuilder);

    const adapter = selectEmailAdapter(dependencies.deliveryAdapters);

    const delivery = await adapter.send({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        to: invitation.targetEmail,
        subject: buildSubject(invitation, input.mode),
        body: buildBody(invitation, invitationUrl, input.inviterDisplayName),
        actionUrl: invitationUrl,
        correlationId: input.authorization.correlationId,
    });

    return {
        invitationToken: invitation.token,
        invitationUrl,
        delivery,
    };
}

export function isInvitationDeliverySuccessful(delivery: NotificationDeliveryResult): boolean {
    return delivery.status === 'sent' || delivery.status === 'queued';
}

function selectEmailAdapter(adapters: NotificationDeliveryAdapter[]): NotificationDeliveryAdapter {
    const adapter = adapters.find((candidate) => candidate.channel === 'EMAIL');
    if (!adapter) {
        throw new InfrastructureError('No email delivery adapter is configured for invitations.');
    }
    return adapter;
}

function assertInvitationActive(invitation: InvitationRecord, mode: 'initial' | 'resend'): void {
    if (invitation.status !== 'pending') {
        throw new ValidationError(`Cannot ${mode === 'resend' ? 'resend' : 'send'} invitation email because the invitation is ${invitation.status}.`, {
            status: invitation.status,
            token: invitation.token,
        });
    }

    if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
        throw new ValidationError('Cannot send invitation email because the invitation has expired.', {
            expiresAt: invitation.expiresAt.toISOString(),
            token: invitation.token,
        });
    }
}

function buildInvitationUrl(
    token: string,
    builder?: (token: string) => string,
): string {
    if (builder) {
        return builder(token);
    }

    const baseUrl = process.env.APP_BASE_URL ?? resolveAuthBaseURL();
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalized}/accept-invitation?token=${encodeURIComponent(token)}`;
}

function buildSubject(invitation: InvitationRecord, mode: 'initial' | 'resend'): string {
    if (mode === 'resend') {
        return `Reminder: You're invited to join ${invitation.organizationName}`;
    }
    return `You're invited to join ${invitation.organizationName}`;
}

function buildBody(
    invitation: InvitationRecord,
    invitationUrl: string,
    inviterDisplayName?: string,
): string {
    const trimmedInviter = inviterDisplayName?.trim();
    const inviter = trimmedInviter && trimmedInviter.length > 0 ? trimmedInviter : 'an OrgCentral administrator';
    return [
        `You have been invited by ${inviter} to join ${invitation.organizationName}.`,
        'Use the secure link below to review the details and accept your invitation.',
        invitationUrl,
    ].join('\n\n');
}
