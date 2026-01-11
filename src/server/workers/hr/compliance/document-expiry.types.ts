import { z } from 'zod';
import type { WorkerJobAuthorization, WorkerJobEnvelope, WorkerJobMetadata } from '@/server/workers/abstract-org-worker';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import type { DocumentExpiryPayload } from '@/server/use-cases/hr/compliance/process-document-expiry';

export const DOCUMENT_EXPIRY_JOB_NAME = 'hr.compliance.document-expiry';

export const documentExpiryJobAuthorizationSchema: z.ZodType<WorkerJobAuthorization> = z.object({
    userId: z.uuid(),
    requiredPermissions: z.record(z.string().min(1), z.array(z.string().min(1))).optional(),
    requiredAnyPermissions: z
        .array(z.record(z.string().min(1), z.array(z.string().min(1))))
        .optional(),
    expectedClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    expectedResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
    auditSource: z.string().min(3).default('worker:hr:compliance:document-expiry'),
    correlationId: z.uuid().optional(),
}) as z.ZodType<WorkerJobAuthorization>;

export const documentExpiryJobMetadataSchema: z.ZodType<WorkerJobMetadata | undefined> = z
    .object({
        correlationId: z.uuid().optional(),
        cacheScopes: z.array(z.string()).optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
    })
    .partial()
    .optional();

export const documentExpiryPayloadSchema: z.ZodType<DocumentExpiryPayload> = z.object({
    dryRun: z.boolean().optional(),
    thresholdDays: z.array(z.number().positive()).default([30, 14, 7]),
});

export type { DocumentExpiryPayload };

export const documentExpiryEnvelopeSchema = z.object({
    orgId: z.uuid(),
    payload: documentExpiryPayloadSchema,
    authorization: documentExpiryJobAuthorizationSchema,
    metadata: documentExpiryJobMetadataSchema,
});

export type DocumentExpiryEnvelope = WorkerJobEnvelope<DocumentExpiryPayload>;
