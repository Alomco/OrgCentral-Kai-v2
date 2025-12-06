import { z } from 'zod';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { IUnplannedAbsenceRepository } from '@/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract';
import type { AbsenceAttachmentDownloader, AbsenceDocumentAiValidator, AbsenceDocumentAiValidatorResult } from '@/server/types/absence-ai';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';

export const jobAuthorizationSchema = z.object({
    userId: z.uuid(),
    auditSource: z.string().min(3).default('worker:hr:absences:ai'),
    correlationId: z.uuid().optional(),
    requiredRoles: z.array(z.string().min(2)).optional(),
});

export const storageMetadataSchema = z.object({
    storageKey: z.string().min(3),
    fileName: z.string().min(1),
    contentType: z.string().min(3),
    fileSize: z.number().int().positive(),
    checksum: z.string().min(6).optional(),
    dataResidency: z.enum(DATA_RESIDENCY_ZONES),
    dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
    retentionPolicyId: z.uuid().optional(),
});

export const absenceAiValidationJobSchema = z.object({
    orgId: z.uuid(),
    absenceId: z.uuid(),
    attachmentId: z.uuid().optional(),
    force: z.boolean().optional().default(false),
    authorization: jobAuthorizationSchema,
    storage: storageMetadataSchema,
});

export type AbsenceAiValidationJob = z.infer<typeof absenceAiValidationJobSchema>;

export interface AbsenceAiValidationResult {
    absence: UnplannedAbsence;
    aiResult: AbsenceDocumentAiValidatorResult;
    cacheTag: string;
}

export interface AbsenceAiValidationServiceDeps {
    absenceRepository: IUnplannedAbsenceRepository;
    typeConfigRepository: IAbsenceTypeConfigRepository;
    attachmentDownloader: AbsenceAttachmentDownloader;
    aiValidator: AbsenceDocumentAiValidator;
    auditLogger?: (event: AuditEventPayload) => Promise<void> | void;
    now?: () => Date;
}

export const DEFAULT_ROLES = ['orgAdmin'] as const;
