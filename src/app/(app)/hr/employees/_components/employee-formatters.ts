import type { EmployeeProfile } from '@/server/types/hr-types';
import type { EmploymentStatusCode, EmploymentTypeCode, JsonValue, PhoneNumbers } from '@/server/types/hr/people';

import { formatHumanDate } from '../../_components/format-date';

const FALLBACK_TEXT = 'Not set';

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEmploymentCode(value: string | null | undefined): string {
    if (!value) {
        return FALLBACK_TEXT;
    }
    return toTitleCase(value);
}

export function formatOptionalText(value: string | null | undefined): string {
    if (!value) {
        return FALLBACK_TEXT;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : FALLBACK_TEXT;
}

type EmployeeNameProfile = Pick<EmployeeProfile, 'displayName' | 'firstName' | 'lastName'> & {
    employeeNumber?: string | null;
};

export function formatEmployeeName(profile: EmployeeNameProfile): string {
    if (profile.displayName?.trim()) {
        return profile.displayName;
    }

    const first = profile.firstName?.trim() ?? '';
    const last = profile.lastName?.trim() ?? '';
    const combined = `${first} ${last}`.trim();

    if (combined) {
        return combined;
    }

    return profile.employeeNumber ? `Employee ${profile.employeeNumber}` : FALLBACK_TEXT;
}

export function formatEmploymentType(value: EmploymentTypeCode | null | undefined): string {
    return formatEmploymentCode(value);
}

export function formatEmploymentStatus(value: EmploymentStatusCode | null | undefined): string {
    return formatEmploymentCode(value);
}

export function formatDate(value: Date | string | null | undefined): string {
    if (!value) {
        return FALLBACK_TEXT;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return FALLBACK_TEXT;
    }

    return formatHumanDate(date);
}

export function formatPhoneNumbers(phone: PhoneNumbers | null | undefined): string {
    if (!phone) {
        return FALLBACK_TEXT;
    }

    const parts = [
        phone.work ? `Work: ${phone.work}` : null,
        phone.mobile ? `Mobile: ${phone.mobile}` : null,
        phone.home ? `Home: ${phone.home}` : null,
    ].filter((part): part is string => typeof part === 'string');

    return parts.length > 0 ? parts.join(' | ') : FALLBACK_TEXT;
}

export function formatJsonValue(value: JsonValue | null | undefined): string {
    if (value === null || value === undefined) {
        return FALLBACK_TEXT;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return FALLBACK_TEXT;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return FALLBACK_TEXT;
    }
}
