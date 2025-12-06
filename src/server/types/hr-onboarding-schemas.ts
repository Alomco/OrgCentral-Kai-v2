import { z } from 'zod';

export const onboardingInviteSchema = z.object({
    email: z.email(),
    displayName: z.string().trim().min(1).max(120),
    employeeNumber: z.string().trim().min(1).max(64),
    jobTitle: z.string().trim().max(120).optional(),
    employmentType: z.string().trim().max(60).optional(),
    eligibleLeaveTypes: z.array(z.string().trim().min(1)).max(20).optional(),
    onboardingTemplateId: z.uuid().nullable().optional(),
    roles: z.array(z.string().trim().min(1)).max(10).optional(),
});

export type OnboardingInvitePayload = z.infer<typeof onboardingInviteSchema>;
