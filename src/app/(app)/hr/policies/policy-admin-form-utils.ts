import { z } from 'zod';
import { POLICY_CATEGORY_VALUES } from '@/server/services/hr/policies/hr-policy-schemas';

const policyStatusValues = ['draft', 'active'] as const;

const policyAdminBaseSchema = z
    .object({
        title: z.string().trim().min(1, 'Title is required.').max(160),
        content: z.string().trim().min(1, 'Content is required.'),
        category: z.enum(POLICY_CATEGORY_VALUES),
        version: z.string().trim().min(1, 'Version is required.').max(32),
        effectiveDate: z.coerce.date(),
        expiryDate: z.coerce.date().nullable().optional(),
        status: z.enum(policyStatusValues),
        requiresAcknowledgment: z.boolean(),
        applicableRoles: z.string().optional(),
        applicableDepartments: z.string().optional(),
    })
    .superRefine((value, context) => {
        if (value.expiryDate && value.expiryDate.getTime() < value.effectiveDate.getTime()) {
            context.addIssue({
                code: 'custom',
                path: ['expiryDate'],
                message: 'expiryDate cannot be before effectiveDate.',
            });
        }
    });

export const policyAdminCreateSchema = policyAdminBaseSchema;
export const policyAdminUpdateSchema = policyAdminBaseSchema.extend({
    policyId: z.uuid(),
});

export interface PolicyAdminCreateValues {
    title: string;
    content: string;
    category: (typeof POLICY_CATEGORY_VALUES)[number];
    version: string;
    effectiveDate: string;
    expiryDate: string;
    status: (typeof policyStatusValues)[number];
    requiresAcknowledgment: boolean;
    applicableRoles: string;
    applicableDepartments: string;
}

export interface PolicyAdminCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<keyof PolicyAdminCreateValues, string>>;
    values: PolicyAdminCreateValues;
}

export interface PolicyAdminInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function readFormBoolean(formData: FormData, key: string, fallback: boolean): boolean {
    const value = formData.get(key);
    if (typeof value === 'string') {
        return value === 'on';
    }
    return fallback;
}

export function readOptionalNullableValue(value: string): string | null | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed;
}

export function parseCommaList(value: string): string[] {
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

export function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function buildDefaultPolicyAdminValues(
    categories: PolicyAdminCreateValues['category'][],
): PolicyAdminCreateValues {
    return {
        title: '',
        content: '',
        category: categories[0] ?? 'HR_POLICIES',
        version: '1',
        effectiveDate: toDateInputValue(new Date()),
        expiryDate: '',
        status: 'draft',
        requiresAcknowledgment: true,
        applicableRoles: '',
        applicableDepartments: '',
    };
}
