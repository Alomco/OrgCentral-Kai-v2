import { z } from 'zod';
import type { WorkerJobEnvelope, WorkerJobMetadata, WorkerJobAuthorization } from '@/server/workers/abstract-org-worker';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import type { ComplianceReminderPayload } from '@/server/use-cases/hr/compliance/send-compliance-reminders';

export const COMPLIANCE_REMINDER_JOB_NAME = 'hr.compliance.reminder';

export const jobAuthorizationSchema: z.ZodType<WorkerJobAuthorization> = z.object({
    userId: z.uuid(),
    requiredPermissions: z.record(z.string().min(1), z.array(z.string().min(1))).optional(),
    requiredAnyPermissions: z
        .array(z.record(z.string().min(1), z.array(z.string().min(1))))
        .optional(),
    expectedClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    expectedResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
    auditSource: z.string().min(3).default('worker:hr:compliance:reminder'),
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

export const complianceReminderPayloadSchema: z.ZodType<ComplianceReminderPayload> = z.object({
    referenceDate: z.coerce.date().optional(),
    daysUntilExpiry: z.number().int().positive().max(365).default(30),
    targetUserIds: z.array(z.uuid()).optional(),
});

export type { ComplianceReminderPayload };

export const complianceReminderEnvelopeSchema = z.object({
    orgId: z.uuid(),
    payload: complianceReminderPayloadSchema,
    authorization: jobAuthorizationSchema,
    metadata: jobMetadataSchema,
});

export type ComplianceReminderEnvelope = WorkerJobEnvelope<ComplianceReminderPayload>;
export type ComplianceReminderJobAuthorization = WorkerJobAuthorization;
