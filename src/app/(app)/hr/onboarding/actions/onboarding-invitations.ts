'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { revokeOnboardingInvitation } from '@/server/use-cases/hr/onboarding/invitations/revoke-onboarding-invitation';

import type { OnboardingRevokeInviteFormState } from '../form-state';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

const revokeInviteSchema = z.object({
    token: z.string().trim().min(1),
    reason: z.string().trim().min(1).optional(),
});

const onboardingInvitationRepository = new PrismaOnboardingInvitationRepository();

export async function revokeOnboardingInvitationAction(
    previous: OnboardingRevokeInviteFormState,
    formData: FormData,
): Promise<OnboardingRevokeInviteFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;

    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { member: ['invite'] },
                auditSource: 'ui:hr:onboarding:invitations:revoke',
                resourceType: 'hr.onboarding',
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to revoke invitations.',
            values: previous.values,
        };
    }

    try {
        const candidate = {
            token: readFormString(formData, 'token'),
            reason: readFormString(formData, 'reason') || undefined,
        };

        const parsed = revokeInviteSchema.safeParse(candidate);
        if (!parsed.success) {
            return {
                status: 'error',
                message: 'Invalid form data.',
                values: previous.values,
            };
        }

        const { userId } = requireSessionUser(session.session);

        await revokeOnboardingInvitation(
            { onboardingInvitationRepository },
            {
                authorization: session.authorization,
                token: parsed.data.token,
                revokedByUserId: userId,
                reason: parsed.data.reason,
            },
        );

        await invalidateOrgCache(
            session.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            session.authorization.dataClassification,
            session.authorization.dataResidency,
        );

        redirect('/hr/onboarding');
    } catch {
        return {
            status: 'error',
            message: 'Unable to revoke invitation.',
            values: previous.values,
        };
    }
}
