import { Prisma } from '../../../../../generated/client';
import type { TimeEntry as DomainTimeEntry } from '@/server/types/hr-ops-types';
import type { PrismaJsonValue } from '@/server/types/prisma';

type PrismaTimeEntry = Prisma.TimeEntryGetPayload<Record<string, never>>;
type TimeEntryCreatePayload = Prisma.TimeEntryUncheckedCreateInput;
type TimeEntryUpdatePayload = Prisma.TimeEntryUncheckedUpdateManyInput;

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) { return null; }
  if (typeof value === 'number') { return value; }
  if (typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: unknown }).toNumber === 'function') {
    try { return (value as { toNumber: () => number }).toNumber(); } catch { return null; }
  }
  return null;
};

const toJsonInput = (
  value: PrismaJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) { return undefined; }
  if (value === null) { return Prisma.JsonNull; }
  return value as Prisma.InputJsonValue;
};

export function mapPrismaTimeEntryToDomain(record: PrismaTimeEntry): DomainTimeEntry {
  return {
    id: record.id,
    orgId: record.orgId,
    userId: record.userId,
    date: record.date,
    clockIn: record.clockIn,
    clockOut: record.clockOut ?? undefined,
    totalHours: record.totalHours === null ? undefined : toNumberOrNull(record.totalHours),
    breakDuration: record.breakDuration === null ? undefined : toNumberOrNull(record.breakDuration),
    project: record.project ?? undefined,
    tasks: record.tasks,
    notes: record.notes ?? undefined,
    status: record.status,
    approvedByOrgId: record.approvedByOrgId ?? undefined,
    approvedByUserId: record.approvedByUserId ?? undefined,
    approvedAt: record.approvedAt ?? undefined,
    dataClassification: record.dataClassification,
    residencyTag: record.residencyTag,
    metadata: record.metadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapDomainTimeEntryToPrismaCreate(
  input: Omit<DomainTimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
): TimeEntryCreatePayload {
  return {
    orgId: input.orgId,
    userId: input.userId,
    date: input.date,
    clockIn: input.clockIn,
    clockOut: input.clockOut ?? null,
    totalHours: input.totalHours ?? null,
    breakDuration: input.breakDuration ?? null,
    project: input.project ?? null,
    tasks: toJsonInput(input.tasks),
    notes: input.notes ?? null,
    status: input.status,
    approvedByOrgId: input.approvedByOrgId ?? null,
    approvedByUserId: input.approvedByUserId ?? null,
    approvedAt: input.approvedAt ?? null,
    dataClassification: input.dataClassification,
    residencyTag: input.residencyTag,
    metadata: toJsonInput(input.metadata),
  } satisfies TimeEntryCreatePayload;
}

export function mapDomainTimeEntryToPrismaUpdate(
  updates: Partial<Pick<DomainTimeEntry, 'clockIn' | 'clockOut' | 'totalHours' | 'breakDuration' | 'project' | 'tasks' | 'notes' | 'status' | 'approvedByOrgId' | 'approvedByUserId' | 'approvedAt' | 'dataClassification' | 'residencyTag' | 'metadata'>>,
): TimeEntryUpdatePayload {
  return {
    clockIn: updates.clockIn,
    clockOut: updates.clockOut,
    totalHours: updates.totalHours,
    breakDuration: updates.breakDuration,
    project: updates.project,
    tasks: toJsonInput(updates.tasks),
    notes: updates.notes,
    status: updates.status,
    approvedByOrgId: updates.approvedByOrgId,
    approvedByUserId: updates.approvedByUserId,
    approvedAt: updates.approvedAt,
    dataClassification: updates.dataClassification,
    residencyTag: updates.residencyTag,
    metadata: toJsonInput(updates.metadata),
  };
}
