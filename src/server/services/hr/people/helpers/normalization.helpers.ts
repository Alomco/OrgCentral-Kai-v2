import type {
    Certification,
    JsonValue,
    SalaryDetail,
} from '@/server/types/hr/people';
export {
    normalizeContractPayload,
    normalizeContractType,
    normalizeEmploymentStatus,
    normalizeEmploymentType,
} from './normalization.employment';

export function normalizeJsonValue(value: unknown): JsonValue | null | undefined {
    if (value === null || value === undefined) {
        return value === null ? null : undefined;
    }
    if (isJsonValue(value)) {
        return value;
    }
    return undefined;
}

export function normalizeSalaryDetail(value: unknown): SalaryDetail | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    const candidate = value as Record<string, unknown>;
    const detail: SalaryDetail = {};
    let hasValue = false;

    if (typeof candidate.amount === 'number' && Number.isFinite(candidate.amount)) {
        detail.amount = candidate.amount;
        hasValue = true;
    }
    if (typeof candidate.currency === 'string' && candidate.currency.trim().length > 0) {
        detail.currency = candidate.currency.trim();
        hasValue = true;
    }

    const frequency = coerceSalaryFrequency(candidate.frequency);
    if (frequency) {
        detail.frequency = frequency;
        hasValue = true;
    }

    const paySchedule = coercePaySchedule(candidate.paySchedule);
    if (paySchedule) {
        detail.paySchedule = paySchedule;
        hasValue = true;
    }

    return hasValue ? detail : undefined;
}

export function normalizeCertifications(value: unknown): Certification[] | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (!Array.isArray(value)) {
        return undefined;
    }

    if (value.length === 0) {
        return [];
    }

    const normalized = value
        .map((entry) => normalizeCertificationEntry(entry))
        .filter((entry): entry is Certification => entry !== null);

    return normalized.length > 0 ? normalized : undefined;
}

const SALARY_DETAIL_FREQUENCIES = new Set<NonNullable<SalaryDetail['frequency']>>([
    'hourly',
    'monthly',
    'annually',
]);

const PAY_SCHEDULE_DETAIL_VALUES = new Set<NonNullable<SalaryDetail['paySchedule']>>([
    'monthly',
    'bi-weekly',
]);

function normalizeCertificationEntry(entry: unknown): Certification | null {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.name !== 'string' || typeof candidate.issuer !== 'string') {
        return null;
    }

    const dateObtained = coerceDateInput(candidate.dateObtained);
    if (!dateObtained) {
        return null;
    }

    const certification: Certification = {
        name: candidate.name,
        issuer: candidate.issuer,
        dateObtained,
    };

    const expiryDate = coerceDateInput(candidate.expiryDate);
    if (expiryDate) {
        certification.expiryDate = expiryDate;
    }

    return certification;
}

function coerceSalaryFrequency(value: unknown): NonNullable<SalaryDetail['frequency']> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.toLowerCase() as NonNullable<SalaryDetail['frequency']>;
    return SALARY_DETAIL_FREQUENCIES.has(normalized) ? normalized : undefined;
}

function coercePaySchedule(value: unknown): NonNullable<SalaryDetail['paySchedule']> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.toLowerCase() as NonNullable<SalaryDetail['paySchedule']>;
    return PAY_SCHEDULE_DETAIL_VALUES.has(normalized) ? normalized : undefined;
}

function coerceDateInput(value: unknown): Date | string | undefined {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }
    return undefined;
}

function isJsonValue(value: unknown): value is JsonValue {
    if (value === null) {
        return true;
    }
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every(isJsonValue);
    }
    if (valueType === 'object') {
        return Object.values(value as Record<string, unknown>).every(isJsonValue);
    }
    return false;
}
