import { z } from 'zod';

import { LEAVE_POLICY_TYPES } from '@/server/types/leave-types';

const leavePolicyTypeValues = [...LEAVE_POLICY_TYPES] as [
    (typeof LEAVE_POLICY_TYPES)[number],
    ...(typeof LEAVE_POLICY_TYPES)[number][],
];

export const createLeavePolicySchema = z.object({
    name: z.string().trim().min(1, 'Name is required.').max(120),
    type: z.enum(leavePolicyTypeValues),
    accrualAmount: z.coerce.number().nonnegative().max(366),
});

export const updateLeavePolicySchema = z.object({
    policyId: z.uuid(),
    name: z.string().trim().min(1, 'Name is required.').max(120),
    type: z.enum(leavePolicyTypeValues),
    accrualAmount: z.coerce.number().nonnegative().max(366),
    carryOverLimit: z.union([z.string().trim(), z.null()]).optional(),
    requiresApproval: z.boolean(),
    isDefault: z.boolean(),
    statutoryCompliance: z.boolean(),
    maxConsecutiveDays: z.union([z.string().trim(), z.null()]).optional(),
    allowNegativeBalance: z.boolean(),
    activeFrom: z.string().trim().optional(),
    activeTo: z.union([z.string().trim(), z.null()]).optional(),
});

export interface LeavePolicyCreateValues {
    name: string;
    type: (typeof LEAVE_POLICY_TYPES)[number];
    accrualAmount: string;
}

export interface LeavePolicyCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<keyof LeavePolicyCreateValues, string>>;
    values: LeavePolicyCreateValues;
}

export interface LeavePolicyInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const defaultCreateValues: LeavePolicyCreateValues = {
    name: '',
    type: 'ANNUAL',
    accrualAmount: '28',
};

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

export function readOptionalValue(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function readOptionalNullableValue(value: string): string | null | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed;
}
