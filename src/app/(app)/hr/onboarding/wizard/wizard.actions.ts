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
import { sendInvitationEmail } from '@/server/use-cases/notifications/send-invitation-email';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';
import { checkExistingOnboardingTarget } from '@/server/use-cases/hr/onboarding/check-existing-onboarding-target';

import { onboardingWizardSchema, type OnboardingWizardValues } from './wizard.schema';

const profileRepository = new PrismaEmployeeProfileRepository();
const invitationRepository = new PrismaOnboardingInvitationRepository();
const organizationRepository = new PrismaOrganizationRepository({});

const RESOURCE_TYPE = 'hr.onboarding';

export interface WizardSubmitResult {
    success: boolean;
    token?: string;
    error?: string;
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
                employmentType: parsed.data.employmentType,
                eligibleLeaveTypes: parsed.data.eligibleLeaveTypes ?? [],
                onboardingTemplateId,
                roles: [],
            },
        );

        // Try to send the invitation email
        try {
            const dependencies = getInvitationEmailDependencies();
            await sendInvitationEmail(dependencies, {
                authorization: session.authorization,
                invitationToken: result.token,
            });
        } catch {
            // Email sending failed but invitation was created
        }

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
        };
    } catch (error) {
        if (error instanceof ValidationError) {
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

export interface EmailCheckResult {
    exists: boolean;
    reason?: string;
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
                ? 'An employee profile with this email already exists.'
                : 'A pending invitation has already been sent to this email.';
            return { exists: true, reason };
        }

        return { exists: false };
    } catch {
        return { exists: false };
    }
}
