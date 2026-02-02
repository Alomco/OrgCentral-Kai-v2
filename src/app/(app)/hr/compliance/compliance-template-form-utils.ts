import { z } from 'zod';
import type { ComplianceTemplateItem } from '@/server/types/compliance-types';
import { COMPLIANCE_STANDARD_KEYS } from '@/server/types/hr/compliance-standards';
import { jsonValueSchema } from '@/server/types/notification-dispatch';

const complianceItemTypeValues = ['DOCUMENT', 'COMPLETION_DATE', 'YES_NO', 'ACKNOWLEDGEMENT'] as const;
const complianceFileTypeValues = ['pdf', 'docx', 'jpg', 'png'] as const;

const complianceTemplateItemSchema = z.object({
    id: z.string().trim().min(1, 'Item id is required.'),
    name: z.string().trim().min(1, 'Item name is required.'),
    type: z.enum(complianceItemTypeValues),
    isMandatory: z.boolean(),
    guidanceText: z.string().trim().max(1000).optional(),
    allowedFileTypes: z.array(z.enum(complianceFileTypeValues)).optional(),
    yesNoPrompt: z.string().trim().max(300).optional(),
    acknowledgementText: z.string().trim().max(1000).optional(),
    reminderDaysBeforeExpiry: z.coerce.number().int().min(0).optional(),
    expiryDurationDays: z.coerce.number().int().min(1).optional(),
    isInternalOnly: z.boolean().optional(),
    regulatoryRefs: z.array(z.enum(COMPLIANCE_STANDARD_KEYS)).max(10).optional(),
    metadata: jsonValueSchema.optional(),
});

const complianceTemplateItemsSchema = z
    .array(complianceTemplateItemSchema)
    .min(1, 'At least one item is required.');

export const complianceTemplateCreateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required.').max(160),
    categoryKey: z.string().trim().min(1).max(64).optional(),
    version: z.string().trim().min(1).max(32).optional(),
    itemsJson: z.string().trim().min(2, 'Items JSON is required.'),
});

export const complianceTemplateUpdateSchema = complianceTemplateCreateSchema.extend({
    templateId: z.uuid(),
});

export interface ComplianceTemplateCreateValues {
    name: string;
    categoryKey: string;
    version: string;
    itemsJson: string;
}

export interface ComplianceTemplateCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<keyof ComplianceTemplateCreateValues, string>>;
    values: ComplianceTemplateCreateValues;
}

export interface ComplianceTemplateInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const defaultCreateValues: ComplianceTemplateCreateValues = {
    name: '',
    categoryKey: '',
    version: '',
    itemsJson: '',
};

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function readOptionalValue(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function parseTemplateItemsJson(raw: string): ComplianceTemplateItem[] {
    const trimmed = raw.trim();
    if (!trimmed) {
        throw new Error('Items JSON is required.');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        throw new Error('Items must be valid JSON.');
    }

    const result = complianceTemplateItemsSchema.safeParse(parsed);
    if (!result.success) {
        const issue = result.error.issues[0];
        throw new Error(issue.message);
    }

    return result.data as ComplianceTemplateItem[];
}
