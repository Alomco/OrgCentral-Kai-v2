'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { EMPLOYMENT_STATUS_VALUES } from '@/server/types/hr/people';
import type { ProfileMutationPayload } from '@/server/types/hr/people';

import { REVALIDATE_EMPLOYEE_LIST_PATH, UNAUTHORIZED_PROFILE_MESSAGE, UPDATE_PROFILE_ERROR_MESSAGE } from './constants';
import type { EmployeeQuickEditState } from './quick-update-employee-profile.state';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const quickEditSchema = z.object({
    profileId: z.string().regex(UUID_PATTERN, 'Invalid profile id'),
    employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES).optional(),
    jobTitle: z
        .string()
        .trim()
        .max(120, 'Job title is too long')
        .optional()
        .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export async function quickUpdateEmployeeProfileAction(
    previous: EmployeeQuickEditState,
    formData: FormData,
): Promise<EmployeeQuickEditState> {
    const parsed = quickEditSchema.safeParse({
        profileId: formData.get('profileId'),
        employmentStatus: formData.get('employmentStatus'),
        jobTitle: formData.get('jobTitle'),
    });

    if (!parsed.success) {
        const fieldErrors = parsed.error.issues.reduce<NonNullable<EmployeeQuickEditState['fieldErrors']>>(
            (accumulator, issue) => {
                const key = issue.path[0];
                if (key === 'employmentStatus' || key === 'jobTitle') {
                    accumulator[key] = issue.message;
                }
                return accumulator;
            },
            {},
        );

        return {
            status: 'error',
            message: 'Please review the highlighted fields.',
            fieldErrors,
        };
    }

    const { profileId, employmentStatus, jobTitle } = parsed.data;
    const profileUpdates: Pick<ProfileMutationPayload['changes'], 'employmentStatus' | 'jobTitle'> = {};

    if (employmentStatus) {
        profileUpdates.employmentStatus = employmentStatus;
    }

    if (jobTitle) {
        profileUpdates.jobTitle = jobTitle;
    }

    if (Object.keys(profileUpdates).length === 0) {
        return {
            status: 'error',
            message: 'Add a change before saving.',
            fieldErrors: {
                jobTitle: previous.fieldErrors?.jobTitle,
                employmentStatus: previous.fieldErrors?.employmentStatus,
            },
        };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['update'] },
            auditSource: 'ui:hr:employees:quick-edit',
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
            resourceAttributes: { profileId },
        });
    } catch {
        return {
            status: 'error',
            message: UNAUTHORIZED_PROFILE_MESSAGE,
            fieldErrors: previous.fieldErrors,
        };
    }

    try {
        const peopleService = getPeopleService();
        await peopleService.updateEmployeeProfile({
            authorization: session.authorization,
            payload: {
                profileId,
                profileUpdates,
            },
        });

        revalidatePath(REVALIDATE_EMPLOYEE_LIST_PATH);
        revalidatePath(`/hr/employees/${profileId}`);

        return {
            status: 'success',
            message: 'Quick update saved.',
            fieldErrors: undefined,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : UPDATE_PROFILE_ERROR_MESSAGE,
            fieldErrors: previous.fieldErrors,
        };
    }
}
