'use server';

import { headers } from 'next/headers';

import { ValidationError, type ErrorDetails } from '@/server/errors';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import { checkExistingOnboardingTarget } from '@/server/use-cases/hr/onboarding/check-existing-onboarding-target';

import { onboardingWizardSchema, type OnboardingWizardValues } from './wizard.schema';
import type { EmailCheckResult, WizardSubmitResult } from './wizard.types';
import { attemptInvitationEmail, resendPendingInvitation } from './wizard.email';

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

export async function submitOnboardingWizardAction(
    values: OnboardingWizardValues,
): Promise<WizardSubmitResult> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { member: ['invite'] },
                auditSource: 'ui:hr:onboarding:wizard',
                resourceType: RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            success: false,
            error: 'Not authorized to invite employees.',
        };
    }

    const parsed = onboardingWizardSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: 'Invalid form data. Please review and try again.',
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
                departmentId: parsed.data.departmentId,
                employmentType: parsed.data.employmentType,
                startDate: parsed.data.startDate,
                managerEmployeeNumber: parsed.data.managerEmployeeNumber,
                annualSalary: parsed.data.annualSalary,
                salaryCurrency: parsed.data.currency,
                paySchedule: parsed.data.paySchedule,
                eligibleLeaveTypes: parsed.data.eligibleLeaveTypes ?? [],
                onboardingTemplateId,
                roles: [],
            },
        );

        const emailResult = await attemptInvitationEmail(session.authorization, result.token);
        const message = emailResult.delivered
            ? 'Invitation created. Email sent.'
            : `Invitation created, but email delivery failed. ${emailResult.failureMessage ?? 'Invitation email delivery failed.'} Share the invite link manually.`;

        // Invalidate cache
        await invalidateOrgCache(
            session.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            session.authorization.dataClassification,
            session.authorization.dataResidency,
        );

        return {
            success: true,
            token: result.token,
            invitationUrl: emailResult.invitationUrl,
            emailDelivered: emailResult.delivered,
            message,
        };
    } catch (error) {
        if (error instanceof ValidationError) {
            const pendingToken = readPendingInvitationToken(error.details);
            if (pendingToken) {
                return resendPendingInvitation(session.authorization, pendingToken);
            }

            return {
                success: false,
                error: error.message,
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create invitation.',
        };
    }
}

export async function checkEmailExistsAction(email: string): Promise<EmailCheckResult> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { member: ['invite'] },
                auditSource: 'ui:hr:onboarding:email-check',
                resourceType: RESOURCE_TYPE,
            },
        );
    } catch {
        return { exists: false };
    }

    try {
        const result = await checkExistingOnboardingTarget(
            {
                profileRepository,
                invitationRepository,
            },
            {
                authorization: session.authorization,
                email: email.trim().toLowerCase(),
            },
        );

        if (result.exists) {
            const reason = result.kind === 'profile'
                ? 'An employee profile with this email already exists. Update the existing profile instead of inviting again.'
                : 'A pending invitation has already been sent to this email. You can resend it from the invitations list.';
            return { exists: true, reason };
        }

        return { exists: false };
    } catch {
        return { exists: false };
    }
}
