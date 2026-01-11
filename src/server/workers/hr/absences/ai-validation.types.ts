import { z } from 'zod';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import type {
    AbsenceAiValidationJob,
    AbsenceAiValidationJobAuthorization,
    AbsenceAiValidationStorageMetadata,
} from '@/server/use-cases/hr/absences/ai-validation.types';
export type {
    AbsenceAiValidationJob,
    AbsenceAiValidationResult,
    AbsenceAiValidationServiceDeps,
} from '@/server/use-cases/hr/absences/ai-validation.types';

export const jobAuthorizationSchema: z.ZodType<AbsenceAiValidationJobAuthorization> = z.object({
    userId: z.uuid(),
    auditSource: z.string().min(3).default('worker:hr:absences:ai'),
    correlationId: z.uuid().optional(),
    requiredPermissions: z.record(z.string().min(1), z.array(z.string().min(1))).optional(),
    requiredAnyPermissions: z
        .array(z.record(z.string().min(1), z.array(z.string().min(1))))
        .optional(),
    expectedClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    expectedResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
});

export const storageMetadataSchema: z.ZodType<AbsenceAiValidationStorageMetadata> = z.object({
    storageKey: z.string().min(3),
    fileName: z.string().min(1),
    contentType: z.string().min(3),
    fileSize: z.number().int().positive(),
    checksum: z.string().min(6).optional(),
    dataResidency: z.enum(DATA_RESIDENCY_ZONES),
    dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
    retentionPolicyId: z.uuid().optional(),
});

export const absenceAiValidationJobSchema: z.ZodType<AbsenceAiValidationJob> = z.object({
    orgId: z.uuid(),
    absenceId: z.uuid(),
    attachmentId: z.uuid().optional(),
    force: z.boolean().optional().default(false),
    authorization: jobAuthorizationSchema,
    storage: storageMetadataSchema,
});
