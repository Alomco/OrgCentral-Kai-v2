import type { Prisma, EmployeeProfile as PrismaEmployeeProfile } from '@prisma/client';
import type {
    EmployeeProfileDTO,
    EmploymentTypeCode,
    EmploymentStatusCode,
    PeopleListFilters,
} from '@/server/types/hr/people';
import {
    buildDomainProfileFields,
    decimalToNumber,
    extractLegacyProfileFields,
    hasLegacyProfileUpdates,
    mergeLegacyMetadata,
    toDateValue,
    toJsonInput,
    toJsonValue,
    toEmergencyContactValue,
    validateEmployeeProfileDto,
    cloneEmployeeProfileMetadata,
    type EmployeeProfileMetadata,
} from './employee-profile-mapper.helpers';

export const normalizeEmployeeProfileMetadata = (
    metadata: Prisma.JsonValue | null | undefined,
): EmployeeProfileMetadata => cloneEmployeeProfileMetadata(metadata);

export type EmployeeProfileFilters = PeopleListFilters & {
    orgId?: string;
    userId?: string;
    jobTitle?: string;
    employmentType?: EmploymentTypeCode;
    employmentStatus?: EmploymentStatusCode;
    managerOrgId?: string;
    managerUserId?: string;
};

type ExtendedPrismaEmployeeProfile = PrismaEmployeeProfile & EmployeeProfileDTO;

export function mapPrismaEmployeeProfileToDomain(record: PrismaEmployeeProfile): EmployeeProfileDTO {
    const extendedRecord = record as ExtendedPrismaEmployeeProfile;
    const legacyFields = extractLegacyProfileFields(record.metadata);
    const mergedFields = buildDomainProfileFields(extendedRecord, legacyFields);

    return validateEmployeeProfileDto({
        id: extendedRecord.id,
        orgId: extendedRecord.orgId,
        userId: extendedRecord.userId,
        ...mergedFields,
        employeeNumber: extendedRecord.employeeNumber,
        jobTitle: extendedRecord.jobTitle ?? null,
        employmentType: extendedRecord.employmentType,
        employmentStatus: extendedRecord.employmentStatus,
        departmentId: extendedRecord.departmentId ?? null,
        startDate: extendedRecord.startDate ?? null,
        endDate: extendedRecord.endDate ?? null,
        managerOrgId: extendedRecord.managerOrgId ?? null,
        managerUserId: extendedRecord.managerUserId ?? null,
        annualSalary: extendedRecord.annualSalary ?? null,
        hourlyRate: decimalToNumber(extendedRecord.hourlyRate),
        salaryAmount: decimalToNumber(extendedRecord.salaryAmount),
        salaryCurrency: extendedRecord.salaryCurrency ?? null,
        salaryFrequency: extendedRecord.salaryFrequency,
        salaryBasis: extendedRecord.salaryBasis,
        paySchedule: extendedRecord.paySchedule,
        costCenter: extendedRecord.costCenter ?? null,
        location: toJsonValue(extendedRecord.location),
        niNumber: extendedRecord.niNumber ?? null,
        emergencyContact: toEmergencyContactValue(extendedRecord.emergencyContact),
        nextOfKin: toEmergencyContactValue(extendedRecord.nextOfKin),
        healthStatus: extendedRecord.healthStatus,
        workPermit: toJsonValue(extendedRecord.workPermit),
        bankDetails: toJsonValue(extendedRecord.bankDetails),
        metadata: toJsonValue(extendedRecord.metadata),
        dataClassification: extendedRecord.dataClassification,
        dataResidency: extendedRecord.dataResidency,
        auditSource: extendedRecord.auditSource ?? null,
        correlationId: extendedRecord.correlationId ?? null,
        schemaVersion: extendedRecord.schemaVersion,
        createdBy: extendedRecord.createdBy ?? null,
        updatedBy: extendedRecord.updatedBy ?? null,
        retentionPolicy: extendedRecord.retentionPolicy ?? null,
        retentionExpiresAt: extendedRecord.retentionExpiresAt ?? null,
        erasureRequestedAt: extendedRecord.erasureRequestedAt ?? null,
        erasureCompletedAt: extendedRecord.erasureCompletedAt ?? null,
        erasureReason: extendedRecord.erasureReason ?? null,
        erasureActorOrgId: extendedRecord.erasureActorOrgId ?? null,
        erasureActorUserId: extendedRecord.erasureActorUserId ?? null,
        archivedAt: extendedRecord.archivedAt ?? null,
        deletedAt: extendedRecord.deletedAt ?? null,
        createdAt: extendedRecord.createdAt,
        updatedAt: extendedRecord.updatedAt,
    });
}

export function mapDomainEmployeeProfileToPrisma(input: EmployeeProfileDTO): Prisma.EmployeeProfileUncheckedCreateInput {
    const mergedMetadata = mergeLegacyMetadata(input.metadata as Prisma.JsonValue | null | undefined, input);
    const employmentStatus = input.employmentStatus;

    const data: Record<string, unknown> = {
        orgId: input.orgId,
        userId: input.userId,
        email: input.email ?? null,
        personalEmail: input.personalEmail ?? null,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        displayName: input.displayName ?? null,
        photoUrl: input.photoUrl ?? null,
        phone: toJsonInput(input.phone as Prisma.JsonValue | null | undefined),
        address: toJsonInput(input.address as Prisma.JsonValue | null | undefined),
        roles: input.roles ?? [],
        eligibleLeaveTypes: input.eligibleLeaveTypes ?? [],
        employmentStatus,
        employmentPeriods: toJsonInput(input.employmentPeriods as Prisma.JsonValue | null | undefined),
        salaryDetails: toJsonInput(input.salaryDetails as Prisma.JsonValue | null | undefined),
        skills: input.skills ?? [],
        certifications: toJsonInput(input.certifications as Prisma.JsonValue | null | undefined),
        employeeNumber: input.employeeNumber,
        jobTitle: input.jobTitle ?? null,
        employmentType: input.employmentType,
        departmentId: input.departmentId ?? null,
        startDate: toDateValue(input.startDate) ?? null,
        endDate: toDateValue(input.endDate) ?? null,
        managerOrgId: input.managerOrgId ?? null,
        managerUserId: input.managerUserId ?? null,
        annualSalary: input.annualSalary ?? null,
        hourlyRate: input.hourlyRate ?? null,
        salaryAmount: input.salaryAmount ?? null,
        salaryCurrency: input.salaryCurrency ?? null,
        salaryFrequency: input.salaryFrequency ?? null,
        salaryBasis: input.salaryBasis ?? null,
        paySchedule: input.paySchedule ?? null,
        costCenter: input.costCenter ?? null,
        location: toJsonInput(input.location as Prisma.JsonValue | null | undefined),
        niNumber: input.niNumber ?? null,
        emergencyContact: toJsonInput(input.emergencyContact as Prisma.JsonValue | null | undefined),
        nextOfKin: toJsonInput(input.nextOfKin as Prisma.JsonValue | null | undefined),
        healthStatus: input.healthStatus,
        workPermit: toJsonInput(input.workPermit as Prisma.JsonValue | null | undefined),
        bankDetails: toJsonInput(input.bankDetails as Prisma.JsonValue | null | undefined),
        metadata: mergedMetadata ?? toJsonInput(input.metadata as Prisma.JsonValue | null | undefined),
        dataClassification: input.dataClassification,
        residencyTag: input.dataResidency,
        auditSource: input.auditSource ?? null,
        correlationId: input.correlationId ?? null,
        schemaVersion: input.schemaVersion ?? undefined,
        createdBy: input.createdBy ?? null,
        updatedBy: input.updatedBy ?? null,
        retentionPolicy: input.retentionPolicy ?? null,
        retentionExpiresAt: toDateValue(input.retentionExpiresAt) ?? null,
        erasureRequestedAt: toDateValue(input.erasureRequestedAt) ?? null,
        erasureCompletedAt: toDateValue(input.erasureCompletedAt) ?? null,
        erasureReason: input.erasureReason ?? null,
        erasureActorOrgId: input.erasureActorOrgId ?? null,
        erasureActorUserId: input.erasureActorUserId ?? null,
        archivedAt: toDateValue(input.archivedAt) ?? null,
        deletedAt: toDateValue(input.deletedAt) ?? null,
        createdAt: toDateValue(input.createdAt) ?? new Date(),
        updatedAt: toDateValue(input.updatedAt) ?? new Date(),
    };

    return data as Prisma.EmployeeProfileUncheckedCreateInput;
}

export function buildPrismaCreateFromDomain(input: Omit<EmployeeProfileDTO, 'id' | 'createdAt' | 'updatedAt'>): Prisma.EmployeeProfileUncheckedCreateInput {
    return mapDomainEmployeeProfileToPrisma(input as EmployeeProfileDTO);
}

export function buildPrismaUpdateFromDomain(
    updates: Partial<Omit<EmployeeProfileDTO, 'id' | 'orgId' | 'userId' | 'createdAt' | 'employeeNumber'>>,
): Prisma.EmployeeProfileUncheckedUpdateInput {
    const out: Record<string, unknown> = {};

    const setWithTransform = (
        key: string,
        value: unknown,
        transform?: (value: unknown) => Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null | undefined | string | number | Date,
    ): void => {
        if (value === undefined) {
            return;
        }
        const nextValue = transform ? transform(value) : value;
        out[key] = nextValue;
    };

    if (updates.jobTitle !== undefined) { setWithTransform('jobTitle', updates.jobTitle); }
    if (updates.employmentType !== undefined) {
        setWithTransform('employmentType', updates.employmentType);
    }
    if (updates.employmentStatus !== undefined) {
        setWithTransform('employmentStatus', updates.employmentStatus);
    }
    setWithTransform('departmentId', updates.departmentId ?? null);
    setWithTransform('startDate', updates.startDate, (value) => toDateValue(value as Date | string | null | undefined) ?? null);
    setWithTransform('endDate', updates.endDate, (value) => toDateValue(value as Date | string | null | undefined) ?? null);
    setWithTransform('managerOrgId', updates.managerOrgId ?? null);
    setWithTransform('managerUserId', updates.managerUserId ?? null);
    setWithTransform('email', updates.email ?? null);
    setWithTransform('personalEmail', updates.personalEmail ?? null);
    setWithTransform('firstName', updates.firstName ?? null);
    setWithTransform('lastName', updates.lastName ?? null);
    setWithTransform('displayName', updates.displayName ?? null);
    setWithTransform('photoUrl', updates.photoUrl ?? null);
    setWithTransform('phone', updates.phone, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('address', updates.address, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('roles', updates.roles, (value) => value ?? []);
    setWithTransform('eligibleLeaveTypes', updates.eligibleLeaveTypes, (value) => value ?? []);
    setWithTransform('annualSalary', updates.annualSalary ?? null);
    setWithTransform('hourlyRate', updates.hourlyRate ?? null);
    setWithTransform('salaryAmount', updates.salaryAmount ?? null);
    setWithTransform('salaryCurrency', updates.salaryCurrency ?? null);
    if (updates.salaryFrequency !== undefined) {
        setWithTransform('salaryFrequency', updates.salaryFrequency);
    }
    if (updates.salaryBasis !== undefined) {
        setWithTransform('salaryBasis', updates.salaryBasis);
    }
    if (updates.paySchedule !== undefined) {
        setWithTransform('paySchedule', updates.paySchedule);
    }
    setWithTransform('costCenter', updates.costCenter ?? null);
    setWithTransform('location', updates.location, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('niNumber', updates.niNumber ?? null);
    setWithTransform('emergencyContact', updates.emergencyContact, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('nextOfKin', updates.nextOfKin, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    if (updates.healthStatus !== undefined) {
        setWithTransform('healthStatus', updates.healthStatus);
    }
    setWithTransform('workPermit', updates.workPermit, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('bankDetails', updates.bankDetails, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('employmentPeriods', updates.employmentPeriods, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('salaryDetails', updates.salaryDetails, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('skills', updates.skills, (value) => value ?? []);
    setWithTransform('certifications', updates.certifications, (value) => toJsonInput(value as Prisma.JsonValue | null | undefined));
    setWithTransform('dataClassification', updates.dataClassification);
    setWithTransform('residencyTag', updates.dataResidency);
    setWithTransform('auditSource', updates.auditSource ?? null);
    setWithTransform('correlationId', updates.correlationId ?? null);
    setWithTransform('schemaVersion', updates.schemaVersion);
    setWithTransform('createdBy', updates.createdBy ?? null);
    setWithTransform('updatedBy', updates.updatedBy ?? null);
    setWithTransform('retentionPolicy', updates.retentionPolicy ?? null);
    setWithTransform('retentionExpiresAt', updates.retentionExpiresAt, (value) => toDateValue(value as Date | string | null | undefined));
    setWithTransform('erasureRequestedAt', updates.erasureRequestedAt, (value) => toDateValue(value as Date | string | null | undefined));
    setWithTransform('erasureCompletedAt', updates.erasureCompletedAt, (value) => toDateValue(value as Date | string | null | undefined));
    setWithTransform('erasureReason', updates.erasureReason ?? null);
    setWithTransform('erasureActorOrgId', updates.erasureActorOrgId ?? null);
    setWithTransform('erasureActorUserId', updates.erasureActorUserId ?? null);
    setWithTransform('archivedAt', updates.archivedAt, (value) => toDateValue(value as Date | string | null | undefined));
    setWithTransform('deletedAt', updates.deletedAt, (value) => toDateValue(value as Date | string | null | undefined));

    if (updates.metadata !== undefined || hasLegacyProfileUpdates(updates)) {
        out.metadata = mergeLegacyMetadata(
            updates.metadata as Prisma.JsonValue | null | undefined,
            updates,
        );
    }
    return out as Prisma.EmployeeProfileUncheckedUpdateInput;
}

export function buildPrismaWhereFromFilters(filters?: EmployeeProfileFilters): Prisma.EmployeeProfileWhereInput {
    const where: Record<string, unknown> = {};
    if (!filters) { return where; }
    if (filters.orgId) { where.orgId = filters.orgId; }
    if (filters.userId) { where.userId = filters.userId; }
    if (filters.jobTitle) {
        const jobTitleFilter: Prisma.StringFilter = { contains: filters.jobTitle, mode: 'insensitive' };
        where.jobTitle = jobTitleFilter;
    }
    if (filters.employmentType) { where.employmentType = filters.employmentType; }
    if (filters.employmentStatus) { where.employmentStatus = filters.employmentStatus; }
    if (filters.managerOrgId && filters.managerUserId) {
        where.managerOrgId = filters.managerOrgId;
        where.managerUserId = filters.managerUserId;
    }
    if (filters.startDate) {
        const start = toDateValue(filters.startDate);
        if (start) { where.startDate = { gte: start }; }
    }
    if (filters.endDate) {
        const end = toDateValue(filters.endDate);
        if (end) { where.endDate = { lte: end }; }
    }
    return where as Prisma.EmployeeProfileWhereInput;
}
