import { z } from 'zod';
import { jsonValueSchema } from '@/server/types/notification-dispatch';

export const DOCUMENT_TYPE_VALUES = [
    'ONBOARDING',
    'POLICY',
    'CONTRACT',
    'EVIDENCE',
    'TRAINING',
    'PERFORMANCE',
    'COMPLIANCE',
    'MEDICAL',
    'FINANCIAL',
    'SECURITY',
    'OTHER',
] as const;

export const SECURITY_CLASSIFICATION_VALUES = [
    'UNCLASSIFIED',
    'OFFICIAL',
    'OFFICIAL_SENSITIVE',
    'SECRET',
    'TOP_SECRET',
] as const;

export const RETENTION_POLICY_VALUES = [
    'IMMEDIATE',
    'ONE_YEAR',
    'THREE_YEARS',
    'SEVEN_YEARS',
    'PERMANENT',
    'LEGAL_HOLD',
] as const;

export const documentVaultListQuerySchema = z.object({
    ownerUserId: z.uuid().optional(),
    type: z.enum(DOCUMENT_TYPE_VALUES).optional(),
    classification: z.enum(SECURITY_CLASSIFICATION_VALUES).optional(),
    retentionPolicy: z.enum(RETENTION_POLICY_VALUES).optional(),
    fileName: z.string().min(1).max(180).optional(),
});

export const documentVaultStoreSchema = z.object({
    type: z.enum(DOCUMENT_TYPE_VALUES),
    classification: z.enum(SECURITY_CLASSIFICATION_VALUES),
    retentionPolicy: z.enum(RETENTION_POLICY_VALUES),
    blobPointer: z.string().min(1),
    checksum: z.string().min(1),
    fileName: z.string().min(1).max(180),
    ownerOrgId: z.uuid().optional(),
    ownerUserId: z.uuid().optional(),
    version: z.coerce.number().int().min(1).max(999).optional(),
    latestVersionId: z.uuid().optional(),
    mimeType: z.string().min(1).max(120).optional(),
    sizeBytes: z.coerce.number().int().positive().optional(),
    retentionExpires: z.coerce.date().optional(),
    encrypted: z.coerce.boolean().optional(),
    encryptedKeyRef: z.string().min(1).max(200).optional(),
    sensitivityLevel: z.coerce.number().int().min(0).max(4).optional(),
    dataCategory: z.string().min(1).max(120).optional(),
    lawfulBasis: z.string().min(1).max(120).optional(),
    dataSubject: jsonValueSchema.optional(),
    metadata: jsonValueSchema.optional(),
});

export const documentVaultPresignSchema = z.object({
    fileName: z.string().min(1).max(180),
    contentType: z.string().min(1).max(120),
    fileSize: z.number().int().positive(),
});

export type DocumentVaultListQuery = z.infer<typeof documentVaultListQuerySchema>;
export type DocumentVaultStorePayload = z.infer<typeof documentVaultStoreSchema>;
export type DocumentVaultPresignPayload = z.infer<typeof documentVaultPresignSchema>;
