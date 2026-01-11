import { err, ok, type Result } from 'neverthrow';
import { Prisma, type NotificationMessage, type NotificationUrgency, type NotificationTopic } from '@prisma/client';
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

export class NotificationValidationError extends Error { }

const topicToPrisma: Record<NotificationTopicCode, NotificationTopic> = {
    broadcast: 'broadcast',
    'compliance-reminder': 'compliance-reminder',
    'document-expiry': 'document-expiry',
    'leave-approval': 'leave-approval',
    'leave-rejection': 'leave-rejection',
    'performance-review': 'performance-review',
    'policy-update': 'policy-update',
    'system-announcement': 'system-announcement',
    other: 'other',
};

const topicFromPrisma: Record<NotificationTopic, NotificationTopicCode> = {
    broadcast: 'broadcast',
    'compliance-reminder': 'compliance-reminder',
    'document-expiry': 'document-expiry',
    'leave-approval': 'leave-approval',
    'leave-rejection': 'leave-rejection',
    'performance-review': 'performance-review',
    'policy-update': 'policy-update',
    'system-announcement': 'system-announcement',
    other: 'other',
};

const priorityToPrisma: Record<NotificationPriorityCode, NotificationUrgency> = {
    high: 'high',
    low: 'low',
    medium: 'medium',
    urgent: 'urgent',
};

const priorityFromPrisma: Record<NotificationUrgency, NotificationPriorityCode> = {
    high: 'high',
    low: 'low',
    medium: 'medium',
    urgent: 'urgent',
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
): NotificationUrgency[] | undefined {
    return priorities?.length ? priorities.map((priority) => priorityToPrisma[priority]) : undefined;
}

function normalizeJsonInput(
    value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
}
