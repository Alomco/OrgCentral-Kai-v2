import type { JsonRecord, JsonValue } from '@/server/types/json';

const ONBOARDING_FINGERPRINT_KEYS = [
    'employeeId',
    'employeeNumber',
    'onboardingTemplateId',
    'managerEmployeeNumber',
    'departmentId',
] as const;

export function hasOnboardingFingerprint(value: JsonValue | null | undefined): boolean {
    if (!isJsonRecord(value)) {
        return false;
    }
    return ONBOARDING_FINGERPRINT_KEYS.some((key) => typeof value[key] === 'string');
}

export function isJsonRecord(value: JsonValue | null | undefined): value is JsonRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
