import type { EmploymentStatusCode, EmploymentTypeCode } from '@/server/types/hr/people';
import {
    CONTRACT_TYPE_VALUES,
    EMPLOYMENT_STATUS_VALUES,
    EMPLOYMENT_TYPE_VALUES,
} from '@/server/types/hr/people';

export function normalizeContractType(
    value: unknown,
): typeof CONTRACT_TYPE_VALUES[number] | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().replace(/[-\s]/g, '_').toUpperCase();
    if (CONTRACT_TYPE_VALUES.includes(normalized as typeof CONTRACT_TYPE_VALUES[number])) {
        return normalized as typeof CONTRACT_TYPE_VALUES[number];
    }

    const map: Record<string, typeof CONTRACT_TYPE_VALUES[number]> = {
        contractor: 'AGENCY',
        contract: 'AGENCY',
        agency: 'AGENCY',
        consultant: 'CONSULTANT',
        consultancy: 'CONSULTANT',
        intern: 'INTERNSHIP',
        internship: 'INTERNSHIP',
        apprentice: 'APPRENTICESHIP',
        apprenticeship: 'APPRENTICESHIP',
        'fixed-term': 'FIXED_TERM',
        fixed_term: 'FIXED_TERM',
        'fixed term': 'FIXED_TERM',
        permanent: 'PERMANENT',
    };

    return map[value.trim().toLowerCase()];
}

export function normalizeContractPayload(
    raw: Record<string, unknown>,
): Record<string, unknown> {
    const contractType = normalizeContractType(raw.contractType);
    return contractType ? { ...raw, contractType } : raw;
}

export function normalizeEmploymentType(
    value: unknown,
): EmploymentTypeCode | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().replace(/[-\s]/g, '_').toUpperCase();
    if (EMPLOYMENT_TYPE_VALUES.includes(normalized as EmploymentTypeCode)) {
        return normalized as EmploymentTypeCode;
    }

    const map: Record<string, EmploymentTypeCode> = {
        'full-time': 'FULL_TIME',
        full_time: 'FULL_TIME',
        'full time': 'FULL_TIME',
        'part-time': 'PART_TIME',
        part_time: 'PART_TIME',
        'part time': 'PART_TIME',
        contract: 'CONTRACTOR',
        contractor: 'CONTRACTOR',
        intern: 'INTERN',
        internship: 'INTERN',
        apprentice: 'APPRENTICE',
        apprenticeship: 'APPRENTICE',
        'fixed-term': 'FIXED_TERM',
        fixed_term: 'FIXED_TERM',
        'fixed term': 'FIXED_TERM',
        casual: 'CASUAL',
    };

    return map[value.trim().toLowerCase()];
}

export function normalizeEmploymentStatus(
    value: unknown,
): EmploymentStatusCode | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().replace(/[-\s]/g, '_').toUpperCase();
    if (EMPLOYMENT_STATUS_VALUES.includes(normalized as EmploymentStatusCode)) {
        return normalized as EmploymentStatusCode;
    }

    const map: Record<string, EmploymentStatusCode> = {
        active: 'ACTIVE',
        'on-leave': 'ON_LEAVE',
        on_leave: 'ON_LEAVE',
        'on leave': 'ON_LEAVE',
        terminated: 'TERMINATED',
        inactive: 'INACTIVE',
        offboarding: 'OFFBOARDING',
        archived: 'ARCHIVED',
    };

    return map[value.trim().toLowerCase()];
}
