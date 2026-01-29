'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getOnboardingInvitationsForUi } from '@/server/use-cases/hr/onboarding/invitations/get-onboarding-invitations.cached';
import { revokeOnboardingInvitation } from '@/server/use-cases/hr/onboarding/invitations/revoke-onboarding-invitation';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';
import { resendInvitationEmail } from '@/server/use-cases/notifications/resend-invitation-email';
import {
    getInvitationDeliveryFailureMessage,
    isInvitationDeliverySuccessful,
} from '@/server/use-cases/notifications/invitation-email.helpers';
import { hasPermission } from '@/lib/security/permission-check';

import type { OnboardingRevokeInviteFormState } from '../form-state';
import type { ResendOnboardingInvitationActionState } from './onboarding-invitations.types';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

const revokeInviteSchema = z.object({
    token: z.string().trim().min(1),
    reason: z.string().trim().min(1).optional(),
});

const resendInviteSchema = z.object({
    token: z.string().trim().min(1),
});

const onboardingInvitationRepository = new PrismaOnboardingInvitationRepository();
const ONBOARDING_INVITATIONS_AUDIT_PREFIX = 'ui:hr:onboarding:invitations';
const ONBOARDING_RESOURCE_TYPE = 'hr.onboarding';

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
                auditSource: `${ONBOARDING_INVITATIONS_AUDIT_PREFIX}:revoke`,
                resourceType: ONBOARDING_RESOURCE_TYPE,
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

        return {
            status: 'success',
            message: 'Invitation revoked.',
            values: previous.values,
        };
    } catch {
        return {
            status: 'error',
            message: 'Unable to revoke invitation.',
            values: previous.values,
        };
    }
}

export async function resendOnboardingInvitationAction(
    _previous: ResendOnboardingInvitationActionState,
    formData: FormData,
): Promise<ResendOnboardingInvitationActionState> {
    void _previous;

    const parsed = resendInviteSchema.safeParse({
        token: readFormString(formData, 'token'),
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
                auditSource: `${ONBOARDING_INVITATIONS_AUDIT_PREFIX}:resend`,
                resourceType: ONBOARDING_RESOURCE_TYPE,
                action: 'resend',
                resourceAttributes: { token: parsed.data.token },
            },
        );

        const dependencies = getInvitationEmailDependencies();
        const result = await resendInvitationEmail(dependencies, {
            authorization,
            invitationToken: parsed.data.token,
        });

        if (!isInvitationDeliverySuccessful(result.delivery)) {
            return {
                status: 'error',
                message: getInvitationDeliveryFailureMessage(result.delivery),
            };
        }

        await invalidateOrgCache(
            authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            authorization.dataClassification,
            authorization.dataResidency,
        );

        return {
            status: 'success',
            message: 'Invitation email resent.',
            invitationUrl: result.invitationUrl,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to resend invitation.';
        return { status: 'error', message };
    }
}

export async function listOnboardingInvitationsAction(
    limit: number,
): Promise<{ invitations: OnboardingInvitation[] }> {
    try {
        const headerStore = await headers();
        const session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: `${ONBOARDING_INVITATIONS_AUDIT_PREFIX}:list`,
                resourceType: ONBOARDING_RESOURCE_TYPE,
                action: 'list',
            },
        );

        const canInviteMembers =
            hasPermission(session.authorization.permissions, 'member', 'invite') ||
            hasPermission(session.authorization.permissions, 'organization', 'update');
        if (!canInviteMembers) {
            return { invitations: [] };
        }

        const result = await getOnboardingInvitationsForUi({
            authorization: session.authorization,
            limit,
        });

        return { invitations: result.invitations };
    } catch {
        return { invitations: [] };
    }
}
