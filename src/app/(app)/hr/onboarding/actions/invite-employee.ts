'use server';

import { headers } from 'next/headers';

import { ValidationError } from '@/server/errors';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';

import type { OnboardingInviteFormState } from '../form-state';
import { onboardingInviteFormSchema } from '../schema';
import { toFieldErrors } from '../../_components/form-errors';
import {
    buildResendInviteFeedback,
    buildSendInviteFeedback,
    readFormString,
    readPendingInvitationToken,
} from './invite-employee.helpers';

const profileRepository = new PrismaEmployeeProfileRepository();
const invitationRepository = new PrismaOnboardingInvitationRepository();
const organizationRepository = new PrismaOrganizationRepository({});

const RESOURCE_TYPE = 'hr.onboarding';

export async function inviteEmployeeAction(
    previous: OnboardingInviteFormState,
    formData: FormData,
): Promise<OnboardingInviteFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    let headerStore: Headers;
    try {
        headerStore = await headers();
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

        const requestContext = buildInvitationRequestSecurityContext({
            authorization: session.authorization,
            headers: headerStore,
            action: 'hr.onboarding.invite',
            targetEmail: parsed.data.email,
        });

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
                request: requestContext,
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
