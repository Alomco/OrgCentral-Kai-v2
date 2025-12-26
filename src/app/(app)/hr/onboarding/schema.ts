import { z } from 'zod';

function booleanFromFormValue(value: unknown): boolean | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'on') {
            return true;
        }

        if (normalized === 'false' || normalized === '0' || normalized === 'off') {
            return false;
        }

        return undefined;
    }

    return undefined;
}

export const onboardingInviteFormSchema = z.object({
    email: z.email('Enter a valid email address').min(3, 'Email is required'),
    displayName: z.string().trim().min(1, 'Display name is required').max(120, 'Display name is too long'),
    employeeNumber: z.string().trim().min(1, 'Employee number is required').max(64, 'Employee number is too long'),
    jobTitle: z.string().trim().max(120, 'Job title is too long').optional(),
    onboardingTemplateId: z.uuid().optional(),
    includeTemplate: z.preprocess(booleanFromFormValue, z.boolean()).optional(),
});

export type OnboardingInviteFormValues = z.infer<typeof onboardingInviteFormSchema>;
