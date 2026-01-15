import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IInvitationRepository, InvitationRecord } from '@/server/repositories/contracts/auth/invitations';
import type { NotificationDeliveryAdapter } from '@/server/services/platform/notifications/notification-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { deliverInvitationEmail, getInvitationDeliveryFailureMessage } from '../invitation-email.helpers';

const baseInvitation: InvitationRecord = {
    token: 'token-123',
    status: 'pending',
    targetEmail: 'invitee@example.com',
    organizationId: 'org-1',
    organizationName: 'OrgCentral',
    invitedByUid: 'user-1',
    onboardingData: {
        email: 'invitee@example.com',
        displayName: 'Invitee Example',
        roles: ['member'],
    },
};

const authorization: RepositoryAuthorizationContext = {
    orgId: 'org-1',
    userId: 'user-1',
    roleKey: 'custom',
    roleName: null,
    roleId: null,
    roleScope: null,
    permissions: {},
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    auditBatchId: undefined,
    correlationId: 'corr-1',
    tenantScope: {
        orgId: 'org-1',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        auditBatchId: undefined,
    },
};

function buildRepository(invitation: InvitationRecord): IInvitationRepository {
    return {
        findByToken: vi.fn(async (token: string) => (token === invitation.token ? invitation : null)),
        getActiveInvitationByEmail: vi.fn(async () => null),
        listInvitationsByOrg: vi.fn(async () => []),
        createInvitation: vi.fn(async () => invitation),
        updateStatus: vi.fn(async () => undefined),
        revokeInvitation: vi.fn(async () => undefined),
    };
}

function buildAdapter(
    status: 'sent' | 'queued' | 'failed' | 'skipped',
): { adapter: NotificationDeliveryAdapter; send: ReturnType<typeof vi.fn> } {
    const send = vi.fn<NotificationDeliveryAdapter['send']>(async (_payload) => ({
        provider: 'test',
        channel: 'EMAIL',
        status,
        detail: status === 'failed' ? 'Delivery failed' : undefined,
    }));
    return {
        adapter: {
            provider: 'test',
            channel: 'EMAIL',
            send,
        },
        send,
    };
}

describe('deliverInvitationEmail', () => {
    const originalAppBaseUrl = process.env.APP_BASE_URL;
    const originalPublicUrl = process.env.NEXT_PUBLIC_APP_URL;
    const originalAuthBaseUrl = process.env.AUTH_BASE_URL;

    beforeEach(() => {
        delete process.env.APP_BASE_URL;
        delete process.env.NEXT_PUBLIC_APP_URL;
        delete process.env.AUTH_BASE_URL;
    });

    afterEach(() => {
        if (typeof originalAppBaseUrl === 'string') {
            process.env.APP_BASE_URL = originalAppBaseUrl;
        } else {
            delete process.env.APP_BASE_URL;
        }

        if (typeof originalPublicUrl === 'string') {
            process.env.NEXT_PUBLIC_APP_URL = originalPublicUrl;
        } else {
            delete process.env.NEXT_PUBLIC_APP_URL;
        }

        if (typeof originalAuthBaseUrl === 'string') {
            process.env.AUTH_BASE_URL = originalAuthBaseUrl;
        } else {
            delete process.env.AUTH_BASE_URL;
        }
    });

    it('uses the provided invitation link builder', async () => {
        const { adapter, send } = buildAdapter('sent');
        const result = await deliverInvitationEmail(
            {
                invitationRepository: buildRepository(baseInvitation),
                deliveryAdapters: [adapter],
                invitationLinkBuilder: (token) => `https://example.com/invite/${token}`,
            },
            {
                authorization,
                invitationToken: baseInvitation.token,
                mode: 'initial',
            },
        );

        expect(result.invitationUrl).toBe(`https://example.com/invite/${baseInvitation.token}`);
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({
                to: baseInvitation.targetEmail,
                actionUrl: result.invitationUrl,
            }),
        );
    });

    it('builds the invitation URL from NEXT_PUBLIC_APP_URL', async () => {
        process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com/';
        const { adapter } = buildAdapter('sent');
        const result = await deliverInvitationEmail(
            {
                invitationRepository: buildRepository(baseInvitation),
                deliveryAdapters: [adapter],
            },
            {
                authorization,
                invitationToken: baseInvitation.token,
                mode: 'initial',
            },
        );

        expect(result.invitationUrl).toBe(`https://app.example.com/accept-invitation?token=${baseInvitation.token}`);
    });

    it('returns failed delivery results without throwing', async () => {
        const { adapter } = buildAdapter('failed');
        const result = await deliverInvitationEmail(
            {
                invitationRepository: buildRepository(baseInvitation),
                deliveryAdapters: [adapter],
            },
            {
                authorization,
                invitationToken: baseInvitation.token,
                mode: 'resend',
            },
        );

        expect(result.delivery.status).toBe('failed');
    });
});

describe('getInvitationDeliveryFailureMessage', () => {
    it('returns skipped detail when delivery is skipped', () => {
        const message = getInvitationDeliveryFailureMessage({
            provider: 'test',
            channel: 'EMAIL',
            status: 'skipped',
            detail: 'Email delivery is not configured.',
        });

        expect(message).toContain('provider=test');
        expect(message).toContain('status=skipped');
        expect(message).toContain('Email delivery is not configured.');
    });

    it('redacts email addresses and URLs from provider details', () => {
        const message = getInvitationDeliveryFailureMessage({
            provider: 'test',
            channel: 'EMAIL',
            status: 'failed',
            detail: '550 mailbox unavailable for invitee@example.com - see https://provider.example.com/help?token=abc',
        });

        expect(message).toContain('provider=test');
        expect(message).toContain('status=failed');
        expect(message).not.toContain('invitee@example.com');
        expect(message).not.toContain('https://provider.example.com');
        expect(message).not.toContain('token=abc');
    });
});
