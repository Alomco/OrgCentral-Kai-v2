import { Prisma, type HRSettings as PrismaHRSettings } from '@prisma/client';
import type { HRSettings } from '@/server/types/hr-ops-types';
import type { PrismaJsonValue } from '@/server/types/prisma';

type HRSettingsRecord = PrismaHRSettings;
type HRSettingsCreateArguments = Prisma.HRSettingsUncheckedCreateInput;
type HRSettingsUpdateArguments = Prisma.HRSettingsUpdateInput;

const toJsonInput = (
  value: PrismaJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) { return undefined; }
  if (value === null) { return Prisma.JsonNull; }
  return value as Prisma.InputJsonValue;
};

export function mapPrismaHRSettingsToDomain(record: HRSettingsRecord): HRSettings {
  return {
    orgId: record.orgId,
    leaveTypes: record.leaveTypes,
    workingHours: record.workingHours,
    approvalWorkflows: record.approvalWorkflows,
    overtimePolicy: record.overtimePolicy,
    dataClassification: record.dataClassification,
    residencyTag: record.residencyTag,
    metadata: record.metadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapDomainHRSettingsToPrismaCreate(
  orgId: string,
  input: Omit<HRSettings, 'orgId' | 'createdAt' | 'updatedAt'>,
): HRSettingsCreateArguments {
  return {
    orgId,
    leaveTypes: toJsonInput(input.leaveTypes),
    workingHours: toJsonInput(input.workingHours),
    approvalWorkflows: toJsonInput(input.approvalWorkflows),
    overtimePolicy: toJsonInput(input.overtimePolicy),
    dataClassification: input.dataClassification,
    residencyTag: input.residencyTag,
    metadata: toJsonInput(input.metadata),
  };
}

export function mapDomainHRSettingsToPrismaUpdate(
  input: Omit<HRSettings, 'orgId' | 'createdAt' | 'updatedAt'>,
): HRSettingsUpdateArguments {
  return {
    leaveTypes: toJsonInput(input.leaveTypes),
    workingHours: toJsonInput(input.workingHours),
    approvalWorkflows: toJsonInput(input.approvalWorkflows),
    overtimePolicy: toJsonInput(input.overtimePolicy),
    dataClassification: input.dataClassification,
    residencyTag: input.residencyTag,
    metadata: toJsonInput(input.metadata),
  };
}
