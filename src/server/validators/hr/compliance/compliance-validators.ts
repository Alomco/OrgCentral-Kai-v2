import { z } from 'zod';
import { jsonValueSchema } from '@/server/types/notification-dispatch';
import { RETENTION_POLICY_VALUES, SECURITY_CLASSIFICATION_VALUES } from '@/server/types/records/document-vault-schemas';
import { COMPLIANCE_STANDARD_KEYS } from '@/server/types/hr/compliance-standards';

const jsonSchema = jsonValueSchema.optional().nullable();

export const complianceMetadataSchema = jsonSchema;

export const complianceAttachmentSchema = z.object({
    documentId: z.uuid(),
    fileName: z.string().min(1).max(180),
    mimeType: z.string().min(1).max(120).nullable().optional(),
    sizeBytes: z.number().int().positive().nullable().optional(),
    classification: z.enum(SECURITY_CLASSIFICATION_VALUES),
    retentionPolicy: z.enum(RETENTION_POLICY_VALUES),
    version: z.number().int().min(1).max(999),
    uploadedAt: z.iso.datetime(),
});

export const complianceAttachmentsSchema = z.array(complianceAttachmentSchema);

export const complianceTemplateItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    type: z.enum(['DOCUMENT', 'COMPLETION_DATE', 'YES_NO', 'ACKNOWLEDGEMENT']),
    isMandatory: z.boolean(),
    guidanceText: z.string().optional(),
    allowedFileTypes: z.array(z.enum(['pdf', 'docx', 'jpg', 'png'])).optional(),
    yesNoPrompt: z.string().optional(),
    acknowledgementText: z.string().optional(),
    reminderDaysBeforeExpiry: z.number().optional(),
    expiryDurationDays: z.number().optional(),
    isInternalOnly: z.boolean().optional(),
    regulatoryRefs: z.array(z.enum(COMPLIANCE_STANDARD_KEYS)).max(10).optional(),
    metadata: jsonSchema,
});
