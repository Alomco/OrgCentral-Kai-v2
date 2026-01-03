import { z, type ZodError } from 'zod';

export interface PermissionResourceFormValues {
    resource: string;
    actions: string;
    description: string;
}

export interface PermissionResourceCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<PermissionResourceFormValues>;
    values: PermissionResourceFormValues;
}

export interface PermissionResourceInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<PermissionResourceFormValues>;
}

export type FieldErrors<T> = Partial<Record<Extract<keyof T, string>, string>>;

export const defaultCreateValues: PermissionResourceFormValues = {
    resource: '',
    actions: '',
    description: '',
};

const ACTIONS_REQUIRED_MESSAGE = 'At least one action is required.';

const permissionResourceBaseSchema = z.object({
    resource: z.string().trim().min(1, 'Resource name is required.').max(120),
    actions: z.string().trim().min(1, 'At least one action is required.').max(500),
    description: z.string().trim().max(300).optional(),
});

export const permissionResourceCreateSchema = permissionResourceBaseSchema.superRefine((values, context) => {
    const actions = parseActionList(values.actions);
    if (actions.length === 0) {
        context.addIssue({
            code: 'custom',
            message: ACTIONS_REQUIRED_MESSAGE,
            path: ['actions'],
        });
    }
});

export const permissionResourceUpdateSchema = permissionResourceBaseSchema
    .extend({ resourceId: z.uuid() })
    .superRefine((values, context) => {
        const actions = parseActionList(values.actions);
        if (actions.length === 0) {
            context.addIssue({
                code: 'custom',
                message: ACTIONS_REQUIRED_MESSAGE,
                path: ['actions'],
            });
        }
    });

export function toFieldErrors<T>(error: ZodError<T>): FieldErrors<T> {
    return error.issues.reduce<FieldErrors<T>>((accumulator, issue) => {
        const key = issue.path[0];
        if (typeof key === 'string') {
            const typedKey = key as Extract<keyof T, string>;
            if (!accumulator[typedKey]) {
                accumulator[typedKey] = issue.message;
            }
        }
        return accumulator;
    }, {});
}

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function parseActionList(input: string): string[] {
    if (!input) {
        return [];
    }

    const parts = input
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return Array.from(new Set(parts));
}

export function stringifyActionList(actions: string[]): string {
    if (!Array.isArray(actions)) {
        return '';
    }

    return actions
        .filter((action) => typeof action === 'string' && action.trim().length > 0)
        .map((action) => action.trim())
        .join('\n');
}
