import { Prisma } from '@prisma/client';
import type { EmployeeProfile as PrismaEmployeeProfile } from '@prisma/client';
import type { EmployeeProfileDTO, EmergencyContact, JsonValue as DomainJsonValue } from '@/server/types/hr/people';
import { employeeProfileSchema } from '@/server/types/hr-people-schemas';

export function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number | null {
    if (value === null || value === undefined) { return null; }
    if (typeof value === 'number') { return value; }
    try {
        return value.toNumber();
    } catch {
        return null;
    }
}

export function toDateValue(value: Date | string | null | undefined): Date | null {
    if (value === null || value === undefined) { return null; }
    if (value instanceof Date) { return value; }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toJsonInput(value?: Prisma.JsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === null) { return Prisma.JsonNull; }
    if (value === undefined) { return undefined; }
    return value as Prisma.InputJsonValue;
}

export type EmployeeProfileMetadata = Prisma.JsonObject & {
    complianceStatus?: string;
    legacyProfile?: Record<string, unknown>;
};

export function isJsonObject(value: unknown): value is Prisma.JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cloneEmployeeProfileMetadata(value: Prisma.JsonValue | null | undefined): EmployeeProfileMetadata {
    if (isJsonObject(value)) {
        const metadata: EmployeeProfileMetadata = { ...value };
        return metadata;
    }
    return {};
}

export function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
}

export function toNullableString(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }
    return typeof value === 'string' ? value : null;
}

const toOptionalString = (value: unknown): string | undefined => {
    const result = toNullableString(value);
    return result ?? undefined;
};

export function toJsonValue(value: unknown): DomainJsonValue | null | undefined {
    if (value === null) {
        return null;
    }
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => toJsonValue(item) ?? null) as DomainJsonValue;
    }

    if (isJsonObject(value)) {
        const normalized: Record<string, DomainJsonValue> = {};
        for (const [key, entry] of Object.entries(value)) {
            const transformed = toJsonValue(entry);
            if (transformed !== undefined) {
                normalized[key] = transformed;
            }
        }
        return normalized;
    }

    return undefined;
}

export function toEmergencyContactValue(value: Prisma.JsonValue | null | undefined): EmergencyContact | null {
    if (!isJsonObject(value)) {
        return null;
    }

    return {
        name: toOptionalString(value.name),
        relationship: toOptionalString(value.relationship),
        phone: toOptionalString(value.phone),
        email: value.email === null ? null : toNullableString(value.email),
    };
}

export function extractLegacyProfileFields(metadata: Prisma.JsonValue | null): Partial<EmployeeProfileDTO> {
    if (!isJsonObject(metadata)) {
        return {};
    }
    const legacy = isJsonObject(metadata.legacyProfile) ? metadata.legacyProfile : metadata;
    const typedLegacy = legacy as Partial<EmployeeProfileDTO>;
    return {
        employmentPeriods: typedLegacy.employmentPeriods,
        salaryDetails: typedLegacy.salaryDetails,
        skills: typedLegacy.skills,
        certifications: typedLegacy.certifications,
        email: typeof legacy.email === 'string' ? legacy.email : undefined,
        personalEmail: legacy.personalEmail === null
            ? null
            : (typeof legacy.personalEmail === 'string' ? legacy.personalEmail : undefined),
        firstName: typeof legacy.firstName === 'string' ? legacy.firstName : undefined,
        lastName: typeof legacy.lastName === 'string' ? legacy.lastName : undefined,
        displayName: typeof legacy.displayName === 'string' ? legacy.displayName : undefined,
        phone: typedLegacy.phone,
        address: typedLegacy.address,
        roles: Array.isArray(legacy.roles)
            ? legacy.roles.filter((item): item is string => typeof item === 'string')
            : undefined,
        eligibleLeaveTypes: Array.isArray(legacy.eligibleLeaveTypes)
            ? legacy.eligibleLeaveTypes.filter((item): item is string => typeof item === 'string')
            : undefined,
    };
}

export function mergeLegacyMetadata(
    base: Prisma.JsonValue | null | undefined,
    updates: Partial<EmployeeProfileDTO>,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (base === null) {
        return Prisma.JsonNull;
    }

    const baseObject = isJsonObject(base) ? { ...base } : {};
    const legacy = isJsonObject(baseObject.legacyProfile) ? { ...baseObject.legacyProfile } : {};

    const assign = (key: string, value: unknown): void => {
        if (value !== undefined) {
            legacy[key] = value;
        }
    };

    assign('employmentPeriods', updates.employmentPeriods);
    assign('salaryDetails', updates.salaryDetails);
    assign('skills', updates.skills);
    assign('certifications', updates.certifications);
    assign('email', updates.email);
    assign('personalEmail', updates.personalEmail);
    assign('firstName', updates.firstName);
    assign('lastName', updates.lastName);
    assign('displayName', updates.displayName);
    assign('phone', updates.phone);
    assign('address', updates.address);
    assign('roles', updates.roles);
    assign('eligibleLeaveTypes', updates.eligibleLeaveTypes);

    if (!Object.keys(legacy).length && !isJsonObject(base)) {
        return undefined;
    }

    return { ...baseObject, legacyProfile: legacy } as Prisma.InputJsonValue;
}

export function hasLegacyProfileUpdates(updates: Partial<EmployeeProfileDTO>): boolean {
    return [
        updates.employmentPeriods,
        updates.salaryDetails,
        updates.skills,
        updates.certifications,
    ].some((value) => value !== undefined);
}

export function buildDomainProfileFields(
    record: PrismaEmployeeProfile & Partial<EmployeeProfileDTO>,
    legacyFields: Partial<EmployeeProfileDTO>,
): Pick<EmployeeProfileDTO,
    'email' | 'personalEmail' | 'firstName' | 'lastName' | 'displayName' |
    'photoUrl' | 'phone' | 'address' | 'roles' | 'eligibleLeaveTypes' |
    'employmentPeriods' | 'salaryDetails' | 'skills' | 'certifications'> {
    const extendedRecord = record;
    const roles = toStringArray(extendedRecord.roles as unknown);
    const eligible = toStringArray(extendedRecord.eligibleLeaveTypes as unknown);
    const phone = toJsonValue(extendedRecord.phone) as EmployeeProfileDTO['phone'];
    const address = toJsonValue(extendedRecord.address) as EmployeeProfileDTO['address'];
    const email = toNullableString(extendedRecord.email);
    const personalEmail = toNullableString(extendedRecord.personalEmail);
    const firstName = toNullableString(extendedRecord.firstName);
    const lastName = toNullableString(extendedRecord.lastName);
    const displayName = toNullableString(extendedRecord.displayName);
    const employmentPeriods = toJsonValue(extendedRecord.employmentPeriods) as EmployeeProfileDTO['employmentPeriods'];
    const salaryDetails = toJsonValue(extendedRecord.salaryDetails) as EmployeeProfileDTO['salaryDetails'];
    const skills = toStringArray(extendedRecord.skills as unknown);
    const certifications = toJsonValue(extendedRecord.certifications) as EmployeeProfileDTO['certifications'];

    return {
        email: email ?? legacyFields.email ?? null,
        personalEmail: personalEmail ?? legacyFields.personalEmail ?? null,
        firstName: firstName ?? legacyFields.firstName ?? null,
        lastName: lastName ?? legacyFields.lastName ?? null,
        displayName: displayName ?? legacyFields.displayName ?? null,
        photoUrl: toNullableString(extendedRecord.photoUrl) ?? null,
        phone: phone ?? legacyFields.phone,
        address: address ?? legacyFields.address,
        roles: roles.length > 0 ? roles : legacyFields.roles,
        eligibleLeaveTypes: eligible.length > 0 ? eligible : legacyFields.eligibleLeaveTypes,
        employmentPeriods: employmentPeriods ?? legacyFields.employmentPeriods,
        salaryDetails: salaryDetails ?? legacyFields.salaryDetails,
        skills: skills.length > 0 ? skills : legacyFields.skills,
        certifications: certifications ?? legacyFields.certifications,
    };
}

export function validateEmployeeProfileDto(dto: EmployeeProfileDTO): EmployeeProfileDTO {
    const parsed = employeeProfileSchema.safeParse(dto);
    if (!parsed.success) {
        throw new Error(parsed.error.message);
    }
    return parsed.data as EmployeeProfileDTO;
}
