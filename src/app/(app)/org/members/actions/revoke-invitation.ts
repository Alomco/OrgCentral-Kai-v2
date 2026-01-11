'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { ValidationError } from '@/server/errors';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';
import { revokeOrgInvitation } from '@/server/use-cases/auth/invitations/revoke-org-invitation';
import type { RevokeOrgInvitationActionState } from './invitation-actions.types';

const payloadSchema = z.object({
    token: z.string().trim().min(1, 'Invitation token is required.'),
    reason: z.string().trim().optional(),
});

export async function revokeOrgInvitationAction(
    _previous: RevokeOrgInvitationActionState,
    formData: FormData,
): Promise<RevokeOrgInvitationActionState> {
    void _previous;

    const parsed = payloadSchema.safeParse({
        token: formData.get('token'),
        reason: formData.get('reason') ?? undefined,
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
                auditSource: 'ui:org-members:invitation:revoke',
                resourceType: 'org.invitation',
                action: 'revoke',
                resourceAttributes: { token: parsed.data.token },
            },
        );

        await revokeOrgInvitation(
            { invitationRepository: new PrismaInvitationRepository() },
            {
                authorization,
                token: parsed.data.token,
                reason: parsed.data.reason,
            },
        );

        return { status: 'success', message: 'Invitation revoked.' };
    } catch (error) {
        const message = error instanceof ValidationError
            ? error.message
            : error instanceof Error
                ? error.message
                : 'Unable to revoke invitation.';
        return { status: 'error', message };
    }
}
