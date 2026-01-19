import { z } from 'zod';
import type { JsonRecord, JsonValue } from '@/server/types/json';

const MAX_EMAIL = 254;
const MAX_NAME = 120;
const MAX_EMPLOYEE_ID = 64;
const MAX_DEPARTMENT_ID = 64;
const MAX_EMPLOYMENT_TYPE = 60;
const MAX_SALARY_CURRENCY = 8;
const MAX_SALARY_BASIS = 16;
const MAX_PAY_SCHEDULE = 16;
const MAX_ROLE = 60;
const MAX_LEAVE_TYPE = 60;

const trimmedString = z.string().trim();
const requiredString = (max: number) => trimmedString.min(1).max(max);
const optionalNullableString = (max: number) => requiredString(max).optional().nullable();

const optionalNumber = z.number().min(0).optional();
const optionalNullableNumber = optionalNumber.nullable();

const optionalDate = z.union([requiredString(MAX_NAME), z.date()]).optional().nullable();

const onboardingDataInputSchema = z.object({
    email: z.email().trim().max(MAX_EMAIL),
    displayName: requiredString(MAX_NAME),
    firstName: optionalNullableString(MAX_NAME),
    lastName: optionalNullableString(MAX_NAME),
    employeeId: optionalNullableString(MAX_EMPLOYEE_ID),
    employeeNumber: optionalNullableString(MAX_EMPLOYEE_ID),
    position: optionalNullableString(MAX_NAME),
    jobTitle: optionalNullableString(MAX_NAME),
    departmentId: optionalNullableString(MAX_DEPARTMENT_ID),
    employmentType: optionalNullableString(MAX_EMPLOYMENT_TYPE),
    startDate: optionalDate,
    managerEmployeeNumber: optionalNullableString(MAX_EMPLOYEE_ID),
    managerId: optionalNullableString(MAX_EMPLOYEE_ID),
    annualSalary: optionalNullableNumber,
    hourlyRate: optionalNullableNumber,
    salary: z.union([z.number(), z.string()]).optional().nullable(),
    salaryCurrency: optionalNullableString(MAX_SALARY_CURRENCY),
    currency: optionalNullableString(MAX_SALARY_CURRENCY),
    salaryBasis: optionalNullableString(MAX_SALARY_BASIS),
    payBasis: optionalNullableString(MAX_SALARY_BASIS),
    paySchedule: optionalNullableString(MAX_PAY_SCHEDULE),
    payFrequency: optionalNullableString(MAX_PAY_SCHEDULE),
    eligibleLeaveTypes: z.array(requiredString(MAX_LEAVE_TYPE)).max(20).optional(),
    onboardingTemplateId: optionalNullableString(MAX_EMPLOYEE_ID),
    roles: z.array(requiredString(MAX_ROLE)).max(10).optional(),
});

export type OnboardingDataInput = z.input<typeof onboardingDataInputSchema>;

export interface InvitationOnboardingData {
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    position?: string;
    departmentId?: string;
    employmentType?: string;
    startDate?: string;
    managerEmployeeNumber?: string;
    annualSalary?: number;
    hourlyRate?: number;
    salaryCurrency?: string;
    salaryBasis?: string;
    paySchedule?: string;
    eligibleLeaveTypes?: string[];
    onboardingTemplateId?: string;
    roles?: string[];
}

export const onboardingDataSchema = onboardingDataInputSchema.transform((input) =>
    normalizeOnboardingData(input),
);

export type InvitationOnboardingDataInput = z.input<typeof onboardingDataSchema>;

export function parseOnboardingData(input: OnboardingDataInput): InvitationOnboardingData {
    return onboardingDataSchema.parse(input);
}

export function coerceOnboardingData(
    raw: JsonValue | null | undefined,
    fallbackEmail: string,
): InvitationOnboardingData {
    const record = isJsonRecord(raw) ? raw : undefined;
    const email = resolveEmail(record, fallbackEmail);
    const displayName = resolveDisplayName(email, readString(record, 'displayName'));
    const candidate: OnboardingDataInput = {
        ...record,
        email,
        displayName,
    };
    const parsed = onboardingDataSchema.safeParse(candidate);
    if (parsed.success) {
        return parsed.data;
    }
    return { email, displayName };
}

export function resolveDisplayName(email: string, displayName?: string): string {
    const normalized = typeof displayName === 'string' ? displayName.trim() : '';
    if (normalized.length > 0) {
        return normalized;
    }
    const localPart = email.split('@')[0] ?? email;
    const cleaned = localPart.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 0 ? cleaned : email;
}

export function toInvitationJson(data: InvitationOnboardingData): JsonRecord {
    return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
    ) as JsonRecord;
}

function normalizeOnboardingData(input: OnboardingDataInput): InvitationOnboardingData {
    const email = resolveEmail(input, input.email);
    const displayName = resolveDisplayName(email, input.displayName);
    const employeeId = resolveOptionalString(input.employeeId ?? input.employeeNumber);
    const position = resolveOptionalString(input.position ?? input.jobTitle);
    const departmentId = resolveOptionalString(input.departmentId);
    const managerEmployeeNumber = resolveOptionalString(input.managerEmployeeNumber);
    const annualSalary =
        resolveOptionalNumber(input.annualSalary) ?? coerceNumber(input.salary);
    const salaryCurrency = resolveOptionalString(
        input.salaryCurrency ?? input.currency,
    );
    const salaryBasis = resolveOptionalString(
        input.salaryBasis ?? input.payBasis,
    );
    const paySchedule = resolveOptionalString(
        input.paySchedule ?? input.payFrequency,
    );
    const startDate = normalizeDate(input.startDate);

    return {
        email,
        displayName,
        firstName: resolveOptionalString(input.firstName),
        lastName: resolveOptionalString(input.lastName),
        employeeId,
        position,
        departmentId,
        employmentType: resolveOptionalString(input.employmentType),
        startDate,
        managerEmployeeNumber,
        annualSalary,
        hourlyRate: resolveOptionalNumber(input.hourlyRate),
        salaryCurrency,
        salaryBasis,
        paySchedule,
        eligibleLeaveTypes: input.eligibleLeaveTypes,
        onboardingTemplateId: resolveOptionalString(input.onboardingTemplateId),
        roles: input.roles,
    };
}

function resolveEmail(value: JsonRecord | OnboardingDataInput | undefined, fallback: string): string {
    const candidate = readString(value, 'email') ?? fallback;
    return candidate.trim().toLowerCase();
}

function normalizeDate(value?: string | Date | null): string | undefined {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function resolveOptionalString(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function resolveOptionalNumber(value?: number | null): number | undefined {
    return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

function coerceNumber(value?: number | string | null): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function isJsonRecord(value: JsonValue | null | undefined): value is JsonRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(
    record: JsonRecord | OnboardingDataInput | undefined,
    key: keyof OnboardingDataInput,
): string | undefined {
    if (!record) {
        return undefined;
    }
    const candidate = record[key];
    return typeof candidate === 'string' ? candidate : undefined;
}
