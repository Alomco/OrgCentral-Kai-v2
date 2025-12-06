import type {
    ChecklistInstanceCreateInput,
    ChecklistInstanceItemsUpdate,
} from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type {
    ChecklistInstance,
    ChecklistInstanceStatus,
    ChecklistItemProgress,
} from '@/server/types/onboarding-types';
import type { JsonValue } from '@/server/repositories/prisma/helpers/prisma-utils';

export interface ChecklistInstanceRecord {
    id: string;
    orgId: string;
    employeeId: string;
    templateId: string;
    templateName?: string | null;
    status: ChecklistInstanceStatus;
    items: ChecklistItemProgress[] | JsonValue | null | undefined;
    startedAt: Date | string;
    completedAt?: Date | string | null;
    metadata?: JsonValue | null;
}

export function mapChecklistInstanceRecordToDomain(record: ChecklistInstanceRecord): ChecklistInstance {
    const items = Array.isArray(record.items) ? (record.items as ChecklistItemProgress[]) : [];
    const metadata =
        record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
            ? (record.metadata as Record<string, unknown>)
            : undefined;
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        templateId: record.templateId,
        templateName: record.templateName ?? undefined,
        status: record.status,
        items,
        startedAt: record.startedAt instanceof Date ? record.startedAt : new Date(record.startedAt),
        completedAt:
            record.completedAt === undefined || record.completedAt === null
                ? null
                : record.completedAt instanceof Date
                    ? record.completedAt
                    : new Date(record.completedAt),
        metadata,
    };
}

export function mapChecklistInstanceInputToRecord(
    input: ChecklistInstanceCreateInput | ChecklistInstanceItemsUpdate,
): Partial<ChecklistInstanceRecord> {
    const payload: Partial<ChecklistInstanceRecord> = {};
    if ('orgId' in input) {payload.orgId = input.orgId;}
    if ('employeeId' in input) {payload.employeeId = input.employeeId;}
    if ('templateId' in input) {payload.templateId = input.templateId;}
    if ('templateName' in input) {payload.templateName = input.templateName;}
    payload.items = input.items;
    if (input.metadata !== undefined) {payload.metadata = input.metadata as unknown as JsonValue;}
    return payload;
}
