import { z } from 'zod';
import {
    DATA_CLASSIFICATION_LEVELS,
    DATA_RESIDENCY_ZONES,
    type DataClassificationLevel,
    type DataResidencyZone,
} from '@/server/types/tenant';
import type { JsonValue } from '@/server/types/json';

export const NOTIFICATION_TOPICS = [
    'leave-approval',
    'leave-rejection',
    'document-expiry',
    'policy-update',
    'performance-review',
    'system-announcement',
    'compliance-reminder',
    'broadcast',
    'other',
] as const;

export const NOTIFICATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const NOTIFICATION_SCHEMA_VERSION = 1;

const timestampSchema = z.coerce.date();
const jsonValueSchema = z.custom<JsonValue>(() => true);

export const notificationAuditSchema = z.object({
    createdByUserId: z.uuid().optional(),
    auditSource: z.string().min(1),
    correlationId: z.string().optional(),
    auditBatchId: z.string().optional(),
    action: z.string().optional(),
    capturedAt: timestampSchema.default(() => new Date()),
});

export const notificationRecordSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    userId: z.uuid(),
    title: z.string().min(1),
    body: z.string().min(1),
    topic: z.enum(NOTIFICATION_TOPICS),
    priority: z.enum(NOTIFICATION_PRIORITIES),
    isRead: z.boolean(),
    readAt: timestampSchema.nullable().optional(),
    actionUrl: z.url().nullable().optional(),
    actionLabel: z.string().min(1).nullable().optional(),
    scheduledFor: timestampSchema.nullable().optional(),
    expiresAt: timestampSchema.nullable().optional(),
    retentionPolicyId: z.string().min(1),
    dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
    residencyTag: z.enum(DATA_RESIDENCY_ZONES),
    schemaVersion: z.number().int().positive().default(NOTIFICATION_SCHEMA_VERSION),
    correlationId: z.string().nullable().optional(),
    createdByUserId: z.uuid().nullable().optional(),
    auditSource: z.string().min(1),
    metadata: jsonValueSchema.nullable().optional(),
    auditTrail: z.record(z.string(), jsonValueSchema).nullable().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
});

export const notificationCreateSchema = notificationRecordSchema
    .omit({
        id: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        isRead: z.boolean().default(false),
        readAt: timestampSchema.nullable().optional(),
        metadata: jsonValueSchema.nullable().optional(),
        auditTrail: z.record(z.string(), jsonValueSchema).nullable().optional(),
    });

export const notificationListFiltersSchema = z.object({
    unreadOnly: z.boolean().optional(),
    topics: z.array(z.enum(NOTIFICATION_TOPICS)).optional(),
    priorities: z.array(z.enum(NOTIFICATION_PRIORITIES)).optional(),
    since: timestampSchema.optional(),
    until: timestampSchema.optional(),
    includeExpired: z.boolean().optional(),
    limit: z.number().int().positive().max(200).optional(),
});

export const notificationEnvelopeSchema = z.object({
    notificationId: z.uuid(),
    orgId: z.uuid(),
    userId: z.uuid(),
    schemaVersion: z.number().int().positive().default(NOTIFICATION_SCHEMA_VERSION),
    retentionPolicyId: z.string().min(1),
    dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
    residencyTag: z.enum(DATA_RESIDENCY_ZONES),
    payload: notificationRecordSchema,
    auditMetadata: notificationAuditSchema,
    csfleMetadata: z
        .object({
            keyId: z.string().optional(),
            encryptedPaths: z.array(z.string()).optional(),
        })
        .optional(),
    createdAt: timestampSchema.default(() => new Date()),
    expiresAt: timestampSchema.optional(),
});

export type NotificationTopicCode = (typeof NOTIFICATION_TOPICS)[number];
export type NotificationPriorityCode = (typeof NOTIFICATION_PRIORITIES)[number];
export type NotificationRecord = z.infer<typeof notificationRecordSchema>;
export type NotificationCreateInput = z.input<typeof notificationCreateSchema>;
export type NotificationCreatePayload = z.infer<typeof notificationCreateSchema>;
export type NotificationListFilterInput = z.input<typeof notificationListFiltersSchema>;
export type NotificationListFilters = z.infer<typeof notificationListFiltersSchema>;
export type NotificationEnvelope = z.infer<typeof notificationEnvelopeSchema>;
export type NotificationAuditMetadata = z.infer<typeof notificationAuditSchema>;

export interface NotificationValidationContext {
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}
