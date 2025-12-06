import type {
    ChecklistTemplateCreateInput,
    ChecklistTemplateUpdateInput,
} from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { ChecklistTemplate, ChecklistTemplateItem, ChecklistTemplateType } from '@/server/types/onboarding-types';
import type { JsonValue } from '@/server/repositories/prisma/helpers/prisma-utils';

export interface ChecklistTemplateRecord {
    id: string;
    orgId: string;
    name: string;
    type: ChecklistTemplateType;
    items: ChecklistTemplateItem[] | JsonValue | null | undefined;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapChecklistTemplateRecordToDomain(record: ChecklistTemplateRecord): ChecklistTemplate {
    const items = Array.isArray(record.items) ? (record.items as ChecklistTemplateItem[]) : [];
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        type: record.type,
        items,
        createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
    };
}

export function mapChecklistTemplateInputToRecord(
    input: ChecklistTemplateCreateInput | ChecklistTemplateUpdateInput,
): Partial<ChecklistTemplateRecord> {
    const payload: Partial<ChecklistTemplateRecord> = {};
    if ('orgId' in input) { payload.orgId = input.orgId; }
    if (input.name !== undefined) { payload.name = input.name; }
    if (input.type !== undefined) { payload.type = input.type; }
    if (input.items !== undefined) { payload.items = input.items; }
    return payload;
}
