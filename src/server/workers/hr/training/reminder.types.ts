import { z } from 'zod';
import type { WorkerJobAuthorization, WorkerJobEnvelope, WorkerJobMetadata } from '@/server/workers/abstract-org-worker';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import type { TrainingReminderPayload } from '@/server/use-cases/hr/training/send-training-reminders';

export const TRAINING_REMINDER_JOB_NAME = 'hr.training.reminder';

export const jobAuthorizationSchema: z.ZodType<WorkerJobAuthorization> = z.object({
    userId: z.uuid(),
    requiredPermissions: z.record(z.string().min(1), z.array(z.string().min(1))).optional(),
    requiredAnyPermissions: z
        .array(z.record(z.string().min(1), z.array(z.string().min(1))))
        .optional(),
    expectedClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    expectedResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
    auditSource: z.string().min(3).default('worker:hr:training:reminder'),
    correlationId: z.uuid().optional(),
}) as z.ZodType<WorkerJobAuthorization>;

export const jobMetadataSchema: z.ZodType<WorkerJobMetadata | undefined> = z
    .object({
        correlationId: z.uuid().optional(),
        cacheScopes: z.array(z.string()).optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
    })
    .partial()
    .optional();

export const trainingReminderPayloadSchema: z.ZodType<TrainingReminderPayload> = z.object({
    referenceDate: z.coerce.date().optional(),
    daysUntilExpiry: z.number().int().positive().max(365).default(30),
    targetUserIds: z.array(z.uuid()).optional(),
    includeOverdue: z.boolean().optional().default(true),
});

export type TrainingReminderPayloadInput = z.input<typeof trainingReminderPayloadSchema>;
export type { TrainingReminderPayload };

export const trainingReminderEnvelopeSchema = z.object({
    orgId: z.uuid(),
    payload: trainingReminderPayloadSchema,
    authorization: jobAuthorizationSchema,
    metadata: jobMetadataSchema,
});

export type TrainingReminderEnvelope = WorkerJobEnvelope<TrainingReminderPayload>;
export type TrainingReminderJobAuthorization = WorkerJobAuthorization;
