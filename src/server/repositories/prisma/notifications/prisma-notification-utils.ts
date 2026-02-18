import { err, ok, type Result } from 'neverthrow';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    NotificationCreateInput,
    NotificationCreatePayload,
    NotificationListFilterInput,
    NotificationListFilters,
    NotificationPriorityCode,
    NotificationRecord,
    NotificationTopicCode,
} from '@/server/repositories/notifications/notification-schemas';
import {
    NOTIFICATION_SCHEMA_VERSION,
    notificationCreateSchema,
    notificationListFiltersSchema,
    notificationRecordSchema,
} from '@/server/repositories/notifications/notification-schemas';
import type { NotificationCacheContext } from '@/server/repositories/notifications/notification-cache';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { RepositoryAuthorizationError } from '@/server/repositories/security/repository-errors';
import {
    Prisma,
    NotificationPriority,
    NotificationTopic,
    type NotificationMessage,
    type PrismaInputJsonValue,
    type PrismaNullableJsonNullValueInput,
} from '@/server/types/prisma';

export class NotificationValidationError extends Error { }

const topicToPrisma: Record<NotificationTopicCode, NotificationTopic> = {
    broadcast: NotificationTopic.BROADCAST,
    'compliance-reminder': NotificationTopic.COMPLIANCE_REMINDER,
    'document-expiry': NotificationTopic.DOCUMENT_EXPIRY,
    'leave-approval': NotificationTopic.LEAVE_APPROVAL,
    'leave-rejection': NotificationTopic.LEAVE_REJECTION,
    'performance-review': NotificationTopic.PERFORMANCE_REVIEW,
    'policy-update': NotificationTopic.POLICY_UPDATE,
    'system-announcement': NotificationTopic.SYSTEM_ANNOUNCEMENT,
    other: NotificationTopic.OTHER,
};

const topicFromPrisma: Record<NotificationTopic, NotificationTopicCode> = {
    [NotificationTopic.BROADCAST]: 'broadcast',
    [NotificationTopic.COMPLIANCE_REMINDER]: 'compliance-reminder',
    [NotificationTopic.DOCUMENT_EXPIRY]: 'document-expiry',
    [NotificationTopic.LEAVE_APPROVAL]: 'leave-approval',
    [NotificationTopic.LEAVE_REJECTION]: 'leave-rejection',
    [NotificationTopic.PERFORMANCE_REVIEW]: 'performance-review',
    [NotificationTopic.POLICY_UPDATE]: 'policy-update',
    [NotificationTopic.SYSTEM_ANNOUNCEMENT]: 'system-announcement',
    [NotificationTopic.OTHER]: 'other',
};

const priorityToPrisma: Record<NotificationPriorityCode, NotificationPriority> = {
    high: NotificationPriority.HIGH,
    low: NotificationPriority.LOW,
    medium: NotificationPriority.MEDIUM,
    urgent: NotificationPriority.URGENT,
};

const priorityFromPrisma: Record<NotificationPriority, NotificationPriorityCode> = {
    [NotificationPriority.HIGH]: 'high',
    [NotificationPriority.LOW]: 'low',
    [NotificationPriority.MEDIUM]: 'medium',
    [NotificationPriority.URGENT]: 'urgent',
};

export function normalizeCreateInput(
    authorization: RepositoryAuthorizationContext,
    input: NotificationCreateInput,
): Result<NotificationCreatePayload, Error> {
    if (input.orgId && input.orgId !== authorization.orgId) {
        return err(new RepositoryAuthorizationError('Cross-tenant notification creation blocked'));
    }
    if (!input.retentionPolicyId) {
        return err(new NotificationValidationError('retentionPolicyId is required'));
    }

    const draftInput = input as Partial<NotificationCreateInput>;

    const candidate = {
        ...input,
        orgId: authorization.orgId,
        dataClassification: draftInput.dataClassification ?? authorization.dataClassification,
        residencyTag: draftInput.residencyTag ?? authorization.dataResidency,
        auditSource: draftInput.auditSource ?? authorization.auditSource,
        createdByUserId: draftInput.createdByUserId ?? authorization.userId,
        correlationId: draftInput.correlationId ?? authorization.correlationId,
        schemaVersion: draftInput.schemaVersion ?? NOTIFICATION_SCHEMA_VERSION,
    };

    const parsed = notificationCreateSchema.safeParse(candidate);
    if (!parsed.success) {
        return err(new NotificationValidationError(parsed.error.message));
    }

    if (parsed.data.isRead && !parsed.data.readAt) {
        parsed.data.readAt = new Date();
    }

    return ok(parsed.data);
}

export function parseNotificationFilters(filters?: NotificationListFilterInput): Result<NotificationListFilters, Error> {
    if (!filters) {
        return ok({});
    }
    const parsed = notificationListFiltersSchema.safeParse(filters);
    if (!parsed.success) {
        return err(new NotificationValidationError(parsed.error.message));
    }
    return ok(parsed.data);
}

export function toPrismaCreate(
    input: NotificationCreatePayload,
): Prisma.NotificationMessageUncheckedCreateInput {
    return {
        orgId: input.orgId,
        userId: input.userId,
        title: input.title,
        body: input.body,
        topic: topicToPrisma[input.topic],
        priority: priorityToPrisma[input.priority],
        isRead: input.isRead,
        readAt: input.readAt ?? null,
        actionUrl: input.actionUrl ?? undefined,
        actionLabel: input.actionLabel ?? undefined,
        scheduledFor: input.scheduledFor ?? undefined,
        expiresAt: input.expiresAt ?? undefined,
        retentionPolicyId: input.retentionPolicyId,
        dataClassification: input.dataClassification,
        residencyTag: input.residencyTag,
        schemaVersion: input.schemaVersion,
        correlationId: input.correlationId ?? undefined,
        createdByUserId: input.createdByUserId ?? undefined,
        auditSource: input.auditSource,
        metadata: normalizeJsonInput(input.metadata),
        auditTrail: normalizeJsonInput(input.auditTrail),
    };
}

export function toDomain(record: NotificationMessage): NotificationRecord {
    return notificationRecordSchema.parse({
        ...record,
        topic: topicFromPrisma[record.topic],
        priority: priorityFromPrisma[record.priority],
    });
}

interface NotificationCacheSource {
    orgId: string;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
}

export function buildCacheContext(record: NotificationCacheSource): NotificationCacheContext {
    return {
        orgId: record.orgId,
        classification: record.dataClassification,
        residency: record.residencyTag,
    };
}

export function mapTopicsToPrisma(topics?: NotificationTopicCode[]): NotificationTopic[] | undefined {
    return topics?.length ? topics.map((topic) => topicToPrisma[topic]) : undefined;
}

export function mapPrioritiesToPrisma(
    priorities?: NotificationPriorityCode[],
): NotificationPriority[] | undefined {
    return priorities?.length ? priorities.map((priority) => priorityToPrisma[priority]) : undefined;
}

function normalizeJsonInput(
    value: unknown,
): PrismaNullableJsonNullValueInput | PrismaInputJsonValue | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value as PrismaInputJsonValue;
}
