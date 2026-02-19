import type { Prisma } from '../../../../../generated/client';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import {
    hasLegacyProfileUpdates,
    mergeLegacyMetadata,
    toDateValue,
    toJsonInput,
} from './employee-profile-mapper.helpers';

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
