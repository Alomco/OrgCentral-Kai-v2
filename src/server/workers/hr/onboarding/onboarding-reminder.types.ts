import { z } from 'zod';
import type { WorkerJobAuthorization, WorkerJobEnvelope, WorkerJobMetadata } from '@/server/workers/abstract-org-worker';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import type { OnboardingReminderPayload } from '@/server/use-cases/hr/onboarding/send-onboarding-reminders';

export const ONBOARDING_REMINDER_JOB_NAME = 'onboarding-reminder';

export const onboardingReminderJobAuthorizationSchema: z.ZodType<WorkerJobAuthorization> = z.object({
    userId: z.uuid(),
    requiredPermissions: z.record(z.string().min(1), z.array(z.string().min(1))).optional(),
    requiredAnyPermissions: z
        .array(z.record(z.string().min(1), z.array(z.string().min(1))))
        .optional(),
    expectedClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    expectedResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
    auditSource: z.string().min(3).default('worker:hr:onboarding:reminder'),
    correlationId: z.uuid().optional(),
}) as z.ZodType<WorkerJobAuthorization>;

export const onboardingReminderJobMetadataSchema: z.ZodType<WorkerJobMetadata | undefined> = z
    .object({
        correlationId: z.uuid().optional(),
        cacheScopes: z.array(z.string()).optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
    })
    .partial()
    .optional();

export const onboardingReminderPayloadSchema: z.ZodType<OnboardingReminderPayload> = z.object({
    dryRun: z.boolean().optional(),
});

export type { OnboardingReminderPayload };

export const onboardingReminderEnvelopeSchema = z.object({
    orgId: z.uuid(),
    payload: onboardingReminderPayloadSchema,
    authorization: onboardingReminderJobAuthorizationSchema,
    metadata: onboardingReminderJobMetadataSchema,
});

export type OnboardingReminderEnvelope = WorkerJobEnvelope<OnboardingReminderPayload>;

