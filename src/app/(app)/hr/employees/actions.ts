'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import {
    normalizeContractChanges,
    normalizeProfileChanges,
} from '@/server/services/hr/people/helpers/onboard-payload.helpers';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { EMPLOYMENT_STATUS_VALUES } from '@/server/types/hr/people';
import type { ProfileMutationPayload } from '@/server/types/hr/people';

import { toFieldErrors, type FieldErrors } from '../_components/form-errors';
import {
    employeeContractFormSchema,
    employeeProfileFormSchema,
    type EmployeeContractFormValues,
    type EmployeeProfileFormValues,
} from './schema';
import type {
    EmployeeContractFormState,
    EmployeeProfileFormState,
} from './form-state';
import {
    FIELD_CHECK_MESSAGE,
    buildEmergencyContact,
    buildPhoneNumbers,
    buildPostalAddress,
    buildEmployeeContractCandidate,
    buildEmployeeProfileCandidate,
    normalizeOptionalText,
    parseDateField,
    parseJsonField,
    parseOptionalNumberField,
} from './action-helpers';

export interface EmployeeQuickEditState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<'employmentStatus' | 'jobTitle', string>>;
}

export const EMPLOYEE_QUICK_EDIT_INITIAL_STATE: EmployeeQuickEditState = {
    status: 'idle',
};

const UNAUTHORIZED_PROFILE_MESSAGE = 'Not authorized to update employee profiles.';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const UPDATE_PROFILE_ERROR_MESSAGE = 'Unable to update employee profile.';
const REVALIDATE_EMPLOYEE_LIST_PATH = '/hr/employees';

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
export async function updateEmployeeProfileAction(
    previous: EmployeeProfileFormState,
    formData: FormData,
): Promise<EmployeeProfileFormState> {
    const candidate = buildEmployeeProfileCandidate(formData);

    const parsed = employeeProfileFormSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    const startDateParsed = parseDateField(parsed.data.startDate, false);
    const endDateParsed = parseDateField(parsed.data.endDate, false);
    const annualSalaryParsed = parseOptionalNumberField(parsed.data.annualSalary);
    const hourlyRateParsed = parseOptionalNumberField(parsed.data.hourlyRate);
    const salaryAmountParsed = parseOptionalNumberField(parsed.data.salaryAmount);
    const metadataParsed = parseJsonField(parsed.data.metadata);

    const fieldErrors: FieldErrors<EmployeeProfileFormValues> = {};
    if (startDateParsed.error) {
        fieldErrors.startDate = startDateParsed.error;
    }
    if (endDateParsed.error) {
        fieldErrors.endDate = endDateParsed.error;
    }
    if (annualSalaryParsed.error) {
        fieldErrors.annualSalary = annualSalaryParsed.error;
    }
    if (hourlyRateParsed.error) {
        fieldErrors.hourlyRate = hourlyRateParsed.error;
    }
    if (salaryAmountParsed.error) {
        fieldErrors.salaryAmount = salaryAmountParsed.error;
    }
    if (metadataParsed.error) {
        fieldErrors.metadata = metadataParsed.error;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors,
            values: parsed.data,
        };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['update'] },
            auditSource: 'ui:hr:employees:profile:update',
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
            resourceAttributes: { profileId: parsed.data.profileId },
        });
    } catch {
        return {
            status: 'error',
            message: UNAUTHORIZED_PROFILE_MESSAGE,
            values: previous.values,
        };
    }

    const salaryFrequency = parsed.data.salaryFrequency
        ? (parsed.data.salaryFrequency)
        : null;
    const salaryBasis = parsed.data.salaryBasis
        ? (parsed.data.salaryBasis)
        : null;
    const paySchedule = parsed.data.paySchedule
        ? (parsed.data.paySchedule)
        : null;

    const profileUpdates = normalizeProfileChanges({
        displayName: normalizeOptionalText(parsed.data.displayName),
        firstName: normalizeOptionalText(parsed.data.firstName),
        lastName: normalizeOptionalText(parsed.data.lastName),
        email: normalizeOptionalText(parsed.data.email),
        personalEmail: normalizeOptionalText(parsed.data.personalEmail),
        phone: buildPhoneNumbers(
            parsed.data.phoneWork,
            parsed.data.phoneMobile,
            parsed.data.phoneHome,
        ),
        jobTitle: normalizeOptionalText(parsed.data.jobTitle),
        departmentId: normalizeOptionalText(parsed.data.departmentId),
        costCenter: normalizeOptionalText(parsed.data.costCenter),
        managerUserId: normalizeOptionalText(parsed.data.managerUserId),
        employmentType: parsed.data.employmentType,
        employmentStatus: parsed.data.employmentStatus,
        startDate: startDateParsed.date,
        endDate: endDateParsed.date,
        address: buildPostalAddress(
            parsed.data.addressStreet,
            parsed.data.addressCity,
            parsed.data.addressState,
            parsed.data.addressPostalCode,
            parsed.data.addressCountry,
        ),
        emergencyContact: buildEmergencyContact(
            parsed.data.emergencyContactName,
            parsed.data.emergencyContactRelationship,
            parsed.data.emergencyContactPhone,
            parsed.data.emergencyContactEmail,
        ),
        annualSalary: annualSalaryParsed.value,
        hourlyRate: hourlyRateParsed.value,
        salaryAmount: salaryAmountParsed.value,
        salaryCurrency: normalizeOptionalText(parsed.data.salaryCurrency),
        salaryFrequency,
        salaryBasis,
        paySchedule,
        metadata: metadataParsed.value,
    });

    try {
        const peopleService = getPeopleService();
        await peopleService.updateEmployeeProfile({
            authorization: session.authorization,
            payload: {
                profileId: parsed.data.profileId,
                profileUpdates,
            },
        });

        revalidatePath(REVALIDATE_EMPLOYEE_LIST_PATH);
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);

        return {
            status: 'success',
            message: 'Employee profile updated.',
            fieldErrors: undefined,
            values: parsed.data,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : UPDATE_PROFILE_ERROR_MESSAGE,
            fieldErrors: undefined,
            values: parsed.data,
        };
    }
}

export async function saveEmployeeContractAction(
    previous: EmployeeContractFormState,
    formData: FormData,
): Promise<EmployeeContractFormState> {
    const candidate = buildEmployeeContractCandidate(formData);

    const parsed = employeeContractFormSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    const startDateParsed = parseDateField(parsed.data.startDate, true);
    const endDateParsed = parseDateField(parsed.data.endDate, false);
    const probationDateParsed = parseDateField(parsed.data.probationEndDate, false);
    const furloughStartParsed = parseDateField(parsed.data.furloughStartDate, false);
    const furloughEndParsed = parseDateField(parsed.data.furloughEndDate, false);
    const workingPatternParsed = parseJsonField(parsed.data.workingPattern);
    const benefitsParsed = parseJsonField(parsed.data.benefits);

    const contractFieldErrors: FieldErrors<EmployeeContractFormValues> = {};

    const validationErrors = [
        ['startDate', startDateParsed.error],
        ['endDate', endDateParsed.error],
        ['probationEndDate', probationDateParsed.error],
        ['furloughStartDate', furloughStartParsed.error],
        ['furloughEndDate', furloughEndParsed.error],
        ['workingPattern', workingPatternParsed.error],
        ['benefits', benefitsParsed.error],
    ] as const satisfies readonly (readonly [
        Extract<keyof EmployeeContractFormValues, string>,
        string | undefined
    ])[];

    for (const [key, error] of validationErrors) {
        if (error) {
            contractFieldErrors[key] = error;
        }
    }

    if (Object.keys(contractFieldErrors).length > 0) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: contractFieldErrors,
            values: parsed.data,
        };
    }

    const contractId = parsed.data.contractId.trim();
    const isCreate = contractId.length === 0;

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: {
                employmentContract: [isCreate ? 'create' : 'update'],
            },
            auditSource: isCreate
                ? 'ui:hr:employees:contract:create'
                : 'ui:hr:employees:contract:update',
            action: isCreate ? HR_ACTION.CREATE : HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_EMPLOYMENT_CONTRACT,
            resourceAttributes: isCreate
                ? { employeeId: parsed.data.userId }
                : { contractId },
        });
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to update employment contracts.',
            values: previous.values,
        };
    }

    const startDate = startDateParsed.date;
    if (!startDate) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: { startDate: 'Date is required.' },
            values: parsed.data,
        };
    }

    const contractUpdates = normalizeContractChanges({
        contractType: parsed.data.contractType,
        jobTitle: parsed.data.jobTitle,
        departmentId: normalizeOptionalText(parsed.data.departmentId),
        location: normalizeOptionalText(parsed.data.location),
        startDate,
        endDate: endDateParsed.date,
        probationEndDate: probationDateParsed.date,
        furloughStartDate: furloughStartParsed.date,
        furloughEndDate: furloughEndParsed.date,
        terminationReason: normalizeOptionalText(parsed.data.terminationReason),
        terminationNotes: normalizeOptionalText(parsed.data.terminationNotes),
        workingPattern: workingPatternParsed.value,
        benefits: benefitsParsed.value,
    });

    try {
        const peopleService = getPeopleService();

        if (isCreate) {
            await peopleService.createEmploymentContract({
                authorization: session.authorization,
                payload: {
                    contractData: {
                        ...contractUpdates,
                        userId: parsed.data.userId,
                        contractType: parsed.data.contractType,
                        jobTitle: parsed.data.jobTitle,
                        startDate,
                    },
                },
            });
        } else {
            await peopleService.updateEmploymentContract({
                authorization: session.authorization,
                payload: {
                    contractId,
                    contractUpdates,
                },
            });
        }

        revalidatePath(REVALIDATE_EMPLOYEE_LIST_PATH);
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);

        return {
            status: 'success',
            message: isCreate ? 'Employment contract created.' : 'Employment contract updated.',
            fieldErrors: undefined,
            values: parsed.data,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update employment contract.',
            fieldErrors: undefined,
            values: parsed.data,
        };
    }
}
