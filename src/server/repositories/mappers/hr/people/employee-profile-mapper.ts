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
    mergeLegacyMetadata,
    toDateValue,
    toJsonInput,
    toJsonValue,
    toEmergencyContactValue,
    validateEmployeeProfileDto,
    cloneEmployeeProfileMetadata,
    type EmployeeProfileMetadata,
} from './employee-profile-mapper.helpers';
import { buildPrismaUpdateFromDomain as buildPrismaUpdateFromDomainImpl } from './employee-profile-mapper.update';

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
    return buildPrismaUpdateFromDomainImpl(updates);
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
