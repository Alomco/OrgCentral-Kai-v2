import type { Prisma, EmploymentContract as PrismaEmploymentContract } from '@prisma/client';
import type { ContractTypeCode, EmploymentContractDTO } from '@/server/types/hr/people';
import {
  toDateValue,
  toJsonInput,
  toJsonValue,
  toNullableString,
} from './employee-profile-mapper.helpers';

const setIfDefined = <T>(value: T | undefined, setter: (value: T) => void): void => {
  if (value === undefined) {
    return;
  }
  setter(value);
};

const toJsonOrNull = (value: unknown): EmploymentContractDTO['workingPattern'] => {
  const jsonValue = toJsonValue(value);
  return jsonValue === undefined ? null : (jsonValue as EmploymentContractDTO['workingPattern']);
};

const toRetentionPolicyInput = (
  value: EmploymentContractDTO['retentionPolicy'],
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value ?? null;
};

type ContractMetadataFields = Partial<{
  dataClassification: EmploymentContractDTO['dataClassification'];
  residencyTag: EmploymentContractDTO['dataResidency'];
  schemaVersion: number;
  auditSource: string | null;
  correlationId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  retentionPolicy: string | null;
  retentionExpiresAt: Date | string | null;
  erasureRequestedAt: Date | string | null;
  erasureCompletedAt: Date | string | null;
  erasureReason: string | null;
  erasureActorOrgId: string | null;
  erasureActorUserId: string | null;
  deletedAt: Date | string | null;
}>;

const coerceClassification = (value: unknown): EmploymentContractDTO['dataClassification'] => {
  if (typeof value === 'string') {
    return value as EmploymentContractDTO['dataClassification'];
  }
  return 'OFFICIAL' as EmploymentContractDTO['dataClassification'];
};

const coerceResidency = (value: unknown): EmploymentContractDTO['dataResidency'] => {
  if (typeof value === 'string') {
    return value as EmploymentContractDTO['dataResidency'];
  }
  return 'UK_ONLY' as EmploymentContractDTO['dataResidency'];
};

const coerceSchemaVersion = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

export function mapPrismaEmploymentContractToDomain(record: PrismaEmploymentContract): EmploymentContractDTO {
  const extendedRecord = record as PrismaEmploymentContract & ContractMetadataFields;
  const dataClassification = coerceClassification(extendedRecord.dataClassification);
  const dataResidency = coerceResidency(extendedRecord.residencyTag);
  const schemaVersion = coerceSchemaVersion(extendedRecord.schemaVersion);

  return {
    id: record.id,
    orgId: record.orgId,
    userId: record.userId,
    contractType: record.contractType as ContractTypeCode,
    jobTitle: record.jobTitle,
    departmentId: record.departmentId ?? null,
    startDate: record.startDate,
    endDate: record.endDate ?? null,
    probationEndDate: record.probationEndDate ?? null,
    furloughStartDate: record.furloughStartDate ?? null,
    furloughEndDate: record.furloughEndDate ?? null,
    workingPattern: toJsonOrNull(record.workingPattern),
    benefits: toJsonOrNull(record.benefits),
    terminationReason: toNullableString(record.terminationReason),
    terminationNotes: toNullableString(record.terminationNotes),
    archivedAt: toDateValue(record.archivedAt as Date | string | null | undefined) ?? null,
    deletedAt: toDateValue(extendedRecord.deletedAt) ?? null,
    dataClassification,
    dataResidency,
    auditSource: toNullableString(extendedRecord.auditSource),
    correlationId: toNullableString(extendedRecord.correlationId),
    schemaVersion,
    createdBy: toNullableString(extendedRecord.createdBy),
    updatedBy: toNullableString(extendedRecord.updatedBy),
    retentionPolicy: toNullableString(extendedRecord.retentionPolicy),
    retentionExpiresAt: toDateValue(extendedRecord.retentionExpiresAt) ?? null,
    erasureRequestedAt: toDateValue(extendedRecord.erasureRequestedAt) ?? null,
    erasureCompletedAt: toDateValue(extendedRecord.erasureCompletedAt) ?? null,
    erasureReason: toNullableString(extendedRecord.erasureReason),
    erasureActorOrgId: toNullableString(extendedRecord.erasureActorOrgId),
    erasureActorUserId: toNullableString(extendedRecord.erasureActorUserId),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    location: toNullableString(record.location),
  };
}

export function mapDomainEmploymentContractToPrisma(
  input: EmploymentContractDTO,
): Prisma.EmploymentContractUncheckedCreateInput {
  const data: Record<string, unknown> = {
    orgId: input.orgId,
    userId: input.userId,
    contractType: input.contractType as Prisma.EmploymentContractUncheckedCreateInput['contractType'],
    startDate: toDateValue(input.startDate) ?? new Date(),
    endDate: toDateValue(input.endDate) ?? null,
    jobTitle: input.jobTitle,
    departmentId: input.departmentId ?? null,
    location: input.location ?? null,
    probationEndDate: toDateValue(input.probationEndDate) ?? null,
    furloughStartDate: toDateValue(input.furloughStartDate) ?? null,
    furloughEndDate: toDateValue(input.furloughEndDate) ?? null,
    workingPattern: toJsonInput(input.workingPattern as Prisma.JsonValue | null | undefined),
    benefits: toJsonInput(input.benefits as Prisma.JsonValue | null | undefined),
    terminationReason: input.terminationReason ?? null,
    terminationNotes: input.terminationNotes ?? null,
    archivedAt: toDateValue(input.archivedAt) ?? null,
    deletedAt: toDateValue(input.deletedAt) ?? null,
    dataClassification: input.dataClassification,
    residencyTag: input.dataResidency,
    auditSource: input.auditSource ?? null,
    correlationId: input.correlationId ?? null,
    schemaVersion: input.schemaVersion ?? undefined,
    createdBy: input.createdBy ?? null,
    updatedBy: input.updatedBy ?? null,
    retentionPolicy: toRetentionPolicyInput(input.retentionPolicy),
    retentionExpiresAt: toDateValue(input.retentionExpiresAt) ?? null,
    erasureRequestedAt: toDateValue(input.erasureRequestedAt) ?? null,
    erasureCompletedAt: toDateValue(input.erasureCompletedAt) ?? null,
    erasureReason: input.erasureReason ?? null,
    erasureActorOrgId: input.erasureActorOrgId ?? null,
    erasureActorUserId: input.erasureActorUserId ?? null,
  };

  return data as Prisma.EmploymentContractUncheckedCreateInput;
}

export function mapDomainEmploymentContractToPrismaUpdate(
  updates: Partial<Omit<EmploymentContractDTO, 'id' | 'orgId' | 'userId' | 'createdAt'>>,
): Prisma.EmploymentContractUncheckedUpdateInput {
  const data: Record<string, unknown> = {};
  setIfDefined(updates.contractType, (contractType) => {
    data.contractType = contractType as Prisma.EmploymentContractUncheckedUpdateInput['contractType'];
  });
  setIfDefined(updates.jobTitle, (jobTitle) => {
    data.jobTitle = jobTitle;
  });
  setIfDefined(updates.departmentId, (departmentId) => {
    data.departmentId = departmentId ?? null;
  });
  setIfDefined(updates.startDate, (startDate) => {
    data.startDate = toDateValue(startDate) ?? undefined;
  });
  setIfDefined(updates.endDate, (endDate) => {
    data.endDate = toDateValue(endDate) ?? null;
  });
  setIfDefined(updates.probationEndDate, (probationEndDate) => {
    data.probationEndDate = toDateValue(probationEndDate) ?? null;
  });
  setIfDefined(updates.furloughStartDate, (furloughStartDate) => {
    data.furloughStartDate = toDateValue(furloughStartDate) ?? null;
  });
  setIfDefined(updates.furloughEndDate, (furloughEndDate) => {
    data.furloughEndDate = toDateValue(furloughEndDate) ?? null;
  });
  setIfDefined(updates.workingPattern, (workingPattern) => {
    data.workingPattern = toJsonInput(workingPattern as Prisma.JsonValue | null | undefined);
  });
  setIfDefined(updates.benefits, (benefits) => {
    data.benefits = toJsonInput(benefits as Prisma.JsonValue | null | undefined);
  });
  setIfDefined(updates.terminationReason, (terminationReason) => {
    data.terminationReason = terminationReason ?? null;
  });
  setIfDefined(updates.terminationNotes, (terminationNotes) => {
    data.terminationNotes = terminationNotes ?? null;
  });
  setIfDefined(updates.archivedAt, (archivedAt) => {
    data.archivedAt = toDateValue(archivedAt) ?? null;
  });
  setIfDefined(updates.location, (location) => {
    data.location = location ?? null;
  });
  setIfDefined(updates.deletedAt, (deletedAt) => {
    data.deletedAt = toDateValue(deletedAt) ?? null;
  });
  setIfDefined(updates.dataClassification, (dataClassification) => {
    data.dataClassification = dataClassification;
  });
  setIfDefined(updates.dataResidency, (dataResidency) => {
    data.residencyTag = dataResidency;
  });
  setIfDefined(updates.auditSource, (auditSource) => {
    data.auditSource = auditSource ?? null;
  });
  setIfDefined(updates.correlationId, (correlationId) => {
    data.correlationId = correlationId ?? null;
  });
  setIfDefined(updates.schemaVersion, (schemaVersion) => {
    data.schemaVersion = schemaVersion;
  });
  setIfDefined(updates.createdBy, (createdBy) => {
    data.createdBy = createdBy ?? null;
  });
  setIfDefined(updates.updatedBy, (updatedBy) => {
    data.updatedBy = updatedBy ?? null;
  });
  setIfDefined(updates.retentionPolicy, (retentionPolicy) => {
    data.retentionPolicy = retentionPolicy ?? null;
  });
  setIfDefined(updates.retentionExpiresAt, (retentionExpiresAt) => {
    data.retentionExpiresAt = toDateValue(retentionExpiresAt) ?? null;
  });
  setIfDefined(updates.erasureRequestedAt, (erasureRequestedAt) => {
    data.erasureRequestedAt = toDateValue(erasureRequestedAt) ?? null;
  });
  setIfDefined(updates.erasureCompletedAt, (erasureCompletedAt) => {
    data.erasureCompletedAt = toDateValue(erasureCompletedAt) ?? null;
  });
  setIfDefined(updates.erasureReason, (erasureReason) => {
    data.erasureReason = erasureReason ?? null;
  });
  setIfDefined(updates.erasureActorOrgId, (erasureActorOrgId) => {
    data.erasureActorOrgId = erasureActorOrgId ?? null;
  });
  setIfDefined(updates.erasureActorUserId, (erasureActorUserId) => {
    data.erasureActorUserId = erasureActorUserId ?? null;
  });
  return data as Prisma.EmploymentContractUncheckedUpdateInput;
}
