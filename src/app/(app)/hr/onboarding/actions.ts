'use server';

import { headers } from 'next/headers';

import { ValidationError } from '@/server/errors';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';

import type { OnboardingInviteFormState } from './form-state';
import { onboardingInviteFormSchema } from './schema';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

const profileRepository = new PrismaEmployeeProfileRepository();
const invitationRepository = new PrismaOnboardingInvitationRepository();
const organizationRepository = new PrismaOrganizationRepository({});

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
                action: 'invite',
                resourceType: 'hr.onboarding',
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
        return { status: 'error', message: 'Invalid form data.', values: previous.values };
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

        await invalidateOrgCache(
            session.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_INVITATIONS,
            session.authorization.dataClassification,
            session.authorization.dataResidency,
        );

        return {
            status: 'success',
            message: 'Invitation created.',
            token: result.token,
            values: {
                ...parsed.data,
                email: '',
                displayName: '',
                employeeNumber: '',
                jobTitle: '',
            },
        };
    } catch (error) {
        const message = error instanceof ValidationError
            ? error.message
            : error instanceof Error
                ? error.message
                : 'Unable to create invitation.';

        return {
            status: 'error',
            message,
            values: previous.values,
        };
    }
}
