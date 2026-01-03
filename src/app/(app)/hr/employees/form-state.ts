import type { EmployeeProfile, EmploymentContract } from '@/server/types/hr-types';
import { CONTRACT_TYPE_VALUES, type JsonValue } from '@/server/types/hr/people';

import type { FieldErrors } from '../_components/form-errors';
import type { EmployeeContractFormValues, EmployeeProfileFormValues } from './schema';

export interface EmployeeProfileFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<EmployeeProfileFormValues>;
    values: EmployeeProfileFormValues;
}

export interface EmployeeContractFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<EmployeeContractFormValues>;
    values: EmployeeContractFormValues;
}

function formatDateInput(value: Date | string | null | undefined): string {
    if (!value) {
        return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().slice(0, 10);
}

function formatNumberInput(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }
    return Number.isFinite(value) ? String(value) : '';
}

function formatJsonInput(value: JsonValue | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '';
    }
}

export function buildInitialEmployeeProfileFormState(
    profile: EmployeeProfile,
): EmployeeProfileFormState {
    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            profileId: profile.id,
            displayName: profile.displayName ?? '',
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email ?? '',
            personalEmail: profile.personalEmail ?? '',
            phoneWork: profile.phone?.work ?? '',
            phoneMobile: profile.phone?.mobile ?? '',
            phoneHome: profile.phone?.home ?? '',
            jobTitle: profile.jobTitle ?? '',
            departmentId: profile.departmentId ?? '',
            costCenter: profile.costCenter ?? '',
            managerUserId: profile.managerUserId ?? '',
            employmentType: profile.employmentType,
            employmentStatus: profile.employmentStatus,
            startDate: formatDateInput(profile.startDate),
            endDate: formatDateInput(profile.endDate),
            addressStreet: profile.address?.street ?? '',
            addressCity: profile.address?.city ?? '',
            addressState: profile.address?.state ?? '',
            addressPostalCode: profile.address?.postalCode ?? '',
            addressCountry: profile.address?.country ?? '',
            emergencyContactName: profile.emergencyContact?.name ?? '',
            emergencyContactRelationship: profile.emergencyContact?.relationship ?? '',
            emergencyContactPhone: profile.emergencyContact?.phone ?? '',
            emergencyContactEmail: profile.emergencyContact?.email ?? '',
            annualSalary: formatNumberInput(profile.annualSalary),
            hourlyRate: formatNumberInput(profile.hourlyRate),
            salaryAmount: formatNumberInput(profile.salaryAmount),
            salaryCurrency: profile.salaryCurrency ?? '',
            salaryFrequency: profile.salaryFrequency ?? '',
            salaryBasis: profile.salaryBasis ?? '',
            paySchedule: profile.paySchedule ?? '',
            metadata: formatJsonInput(profile.metadata),
        },
    };
}

export function buildInitialEmployeeContractFormState(
    profile: EmployeeProfile,
    contract?: EmploymentContract | null,
): EmployeeContractFormState {
    const contractType = contract?.contractType ?? CONTRACT_TYPE_VALUES[0];
    const jobTitle = contract?.jobTitle ?? profile.jobTitle ?? '';
    const departmentId = contract?.departmentId ?? profile.departmentId ?? '';

    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            profileId: profile.id,
            userId: profile.userId,
            contractId: contract?.id ?? '',
            contractType,
            jobTitle,
            departmentId,
            location: contract?.location ?? '',
            startDate: formatDateInput(contract?.startDate),
            endDate: formatDateInput(contract?.endDate),
            probationEndDate: formatDateInput(contract?.probationEndDate),
            terminationReason: contract?.terminationReason ?? '',
            furloughStartDate: formatDateInput(contract?.furloughStartDate),
            furloughEndDate: formatDateInput(contract?.furloughEndDate),
            workingPattern: formatJsonInput(contract?.workingPattern),
            benefits: formatJsonInput(contract?.benefits),
            terminationNotes: contract?.terminationNotes ?? '',
        },
    };
}
