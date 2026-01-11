'use server';

import { headers } from 'next/headers';

import { ValidationError, type ErrorDetails } from '@/server/errors';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import {
    getInvitationDeliveryFailureMessage,
    isInvitationDeliverySuccessful,
} from '@/server/use-cases/notifications/invitation-email.helpers';
import { resendInvitationEmail } from '@/server/use-cases/notifications/resend-invitation-email';
import { sendInvitationEmail } from '@/server/use-cases/notifications/send-invitation-email';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';

import type { OnboardingInviteFormState } from '../form-state';
import { onboardingInviteFormSchema } from '../schema';
import { toFieldErrors } from '../../_components/form-errors';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

const profileRepository = new PrismaEmployeeProfileRepository();
const invitationRepository = new PrismaOnboardingInvitationRepository();
const organizationRepository = new PrismaOrganizationRepository({});

const RESOURCE_TYPE = 'hr.onboarding';

interface PendingInvitationDetails {
    kind: 'pending_invitation';
    token: string;
}

function readPendingInvitationToken(details?: ErrorDetails): string | null {
    const candidate = details as PendingInvitationDetails | undefined;
    if (candidate?.kind === 'pending_invitation' && candidate.token.trim().length > 0) {
        return candidate.token;
    }
    return null;
}

interface InvitationEmailFeedback {
    message: string;
    invitationUrl?: string;
    emailDelivered?: boolean;
}

async function buildSendInviteFeedback(
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

async function buildResendInviteFeedback(
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

export async function inviteEmployeeAction(
    previous: OnboardingInviteFormState,
    formData: FormData,
): Promise<OnboardingInviteFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { member: ['invite'] },
                auditSource: 'ui:hr:onboarding:invite',
                resourceType: RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to invite employees.',
            values: previous.values,
        };
    }

    const candidate = {
        email: readFormString(formData, 'email'),
        displayName: readFormString(formData, 'displayName'),
        employeeNumber: readFormString(formData, 'employeeNumber'),
        jobTitle: readFormString(formData, 'jobTitle') || undefined,
        onboardingTemplateId: readFormString(formData, 'onboardingTemplateId') || undefined,
        includeTemplate: formData.get('includeTemplate'),
    };

    const parsed = onboardingInviteFormSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Please review the highlighted fields.',
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    try {
        const onboardingTemplateId = parsed.data.includeTemplate
            ? (parsed.data.onboardingTemplateId ?? null)
            : null;

        const result = await sendOnboardingInvite(
            {
                profileRepository,
                invitationRepository,
                organizationRepository,
            },
            {
                authorization: session.authorization,
                email: parsed.data.email,
                displayName: parsed.data.displayName,
                employeeNumber: parsed.data.employeeNumber,
                jobTitle: parsed.data.jobTitle,
                onboardingTemplateId,
                eligibleLeaveTypes: [],
                roles: [],
            },
        );

        const emailFeedback = await buildSendInviteFeedback(session.authorization, result.token);

        await invalidateOrgCache(
            session.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            session.authorization.dataClassification,
            session.authorization.dataResidency,
        );

        return {
            status: 'success',
            message: emailFeedback.message,
            token: result.token,
            invitationUrl: emailFeedback.invitationUrl,
            emailDelivered: emailFeedback.emailDelivered,
            fieldErrors: undefined,
            values: {
                ...parsed.data,
                email: '',
                displayName: '',
                employeeNumber: '',
                jobTitle: '',
            },
        };
    } catch (error) {
        if (error instanceof ValidationError) {
            const pendingToken = readPendingInvitationToken(error.details);
            if (pendingToken) {
                const emailFeedback = await buildResendInviteFeedback(session.authorization, pendingToken);

                await invalidateOrgCache(
                    session.authorization.orgId,
                    CACHE_SCOPE_ONBOARDING_INVITATIONS,
                    session.authorization.dataClassification,
                    session.authorization.dataResidency,
                );

                return {
                    status: 'success',
                    message: emailFeedback.message,
                    token: pendingToken,
                    invitationUrl: emailFeedback.invitationUrl,
                    emailDelivered: emailFeedback.emailDelivered,
                    fieldErrors: undefined,
                    values: {
                        ...parsed.data,
                        email: '',
                        displayName: '',
                        employeeNumber: '',
                        jobTitle: '',
                    },
                };
            }
        }

        const message = error instanceof ValidationError
            ? error.message
            : error instanceof Error
                ? error.message
                : 'Unable to create invitation.';

        return {
            status: 'error',
            message,
            fieldErrors: undefined,
            values: previous.values,
        };
    }
}
