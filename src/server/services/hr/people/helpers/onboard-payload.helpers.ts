import type { CreateEmploymentContractPayload } from '@/server/services/hr/people/people-service.types';
import type { OnboardEmployeeInput } from '@/server/services/hr/people/people-orchestration.types';
import type {
    ContractMutationPayload,
    ProfileMutationPayload,
} from '@/server/types/hr/people';
import { bankDetailsSchema } from '@/server/types/hr-people-schemas.shared';
import {
    normalizeCertifications,
    normalizeContractType,
    normalizeEmploymentStatus,
    normalizeEmploymentType,
    normalizeJsonValue,
    normalizeSalaryDetail,
} from './normalization.helpers';

export function buildProfilePayload(
    profileDraft: OnboardEmployeeInput['profileDraft'],
    eligibleLeaveTypes: string[],
): ProfileMutationPayload['changes'] & { userId: string; employeeNumber: string } {
    const { userId, employeeNumber, ...profileChanges } = profileDraft;
    const normalized = normalizeProfileChanges(profileChanges, { eligibleLeaveTypes });

    return {
        ...normalized,
        userId,
        employeeNumber,
    };
}

export function buildContractPayload(
    profileDraft: OnboardEmployeeInput['profileDraft'],
    contractDraft: NonNullable<OnboardEmployeeInput['contractDraft']>,
): CreateEmploymentContractPayload['contractData'] {
    const normalizedContractType = normalizeContractType(contractDraft.contractType);
    if (!normalizedContractType) {
        throw new Error('contractType is required when issuing a contract during onboarding.');
    }

    const jobTitle = contractDraft.jobTitle?.trim();
    if (!jobTitle) {
        throw new Error('jobTitle is required when issuing a contract during onboarding.');
    }

    const { workingPattern, benefits, ...restContract } = contractDraft;
    const normalizedContract = normalizeContractChanges(restContract);

    return {
        ...normalizedContract,
        userId: profileDraft.userId,
        contractType: normalizedContractType,
        jobTitle,
        startDate: contractDraft.startDate ?? new Date().toISOString(),
        workingPattern: normalizeJsonValue(workingPattern),
        benefits: normalizeJsonValue(benefits),
    };
}

export function normalizeProfileChanges(
    profileDraft: ProfileMutationPayload['changes'],
    options?: { eligibleLeaveTypes?: string[] },
): ProfileMutationPayload['changes'] {
    const {
        employmentType,
        employmentStatus,
        location,
        bankDetails,
        workPermit,
        metadata,
        salaryDetails,
        certifications,
        ...restProfile
    } = profileDraft;

    const normalizedEmploymentType = normalizeEmploymentType(employmentType);
    const normalizedEmploymentStatus = normalizeEmploymentStatus(employmentStatus);
    const normalizedBankDetails = normalizeBankDetails(bankDetails);

    return {
        ...restProfile,
        employmentType: normalizedEmploymentType ?? employmentType,
        employmentStatus: normalizedEmploymentStatus ?? employmentStatus,
        eligibleLeaveTypes: options?.eligibleLeaveTypes ?? profileDraft.eligibleLeaveTypes,
        location: normalizeJsonValue(location),
        bankDetails: normalizedBankDetails,
        workPermit: normalizeJsonValue(workPermit),
        metadata: normalizeJsonValue(metadata),
        salaryDetails: normalizeSalaryDetail(salaryDetails),
        certifications: normalizeCertifications(certifications),
    };
}

export function normalizeContractChanges(
    contractDraft: ContractMutationPayload['changes'],
): ContractMutationPayload['changes'] {
    const { workingPattern, benefits, ...restContract } = contractDraft;

    return {
        ...restContract,
        workingPattern: normalizeJsonValue(workingPattern),
        benefits: normalizeJsonValue(benefits),
    };
}

function normalizeBankDetails(value: unknown): ProfileMutationPayload['changes']['bankDetails'] {
    if (value === undefined || value === null) {
        return value;
    }

    const parsed = bankDetailsSchema.safeParse(value);
    if (!parsed.success) {
        return undefined;
    }

    return parsed.data;
}
