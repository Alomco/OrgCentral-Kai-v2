import { z } from 'zod';

function booleanFromFormValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        return value === 'true';
    }

    return value;
}

export const onboardingInviteFormSchema = z.object({
    email: z.email(),
    displayName: z.string().trim().min(1).max(120),
    employeeNumber: z.string().trim().min(1).max(64),
    jobTitle: z.string().trim().max(120).optional(),
    onboardingTemplateId: z.uuid().optional(),
    includeTemplate: z.preprocess(booleanFromFormValue, z.boolean()).optional(),
});

export type OnboardingInviteFormValues = z.infer<typeof onboardingInviteFormSchema>;
