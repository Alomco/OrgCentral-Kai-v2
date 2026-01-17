import type {
  HRNotificationCreateDTO,
  HRNotificationDTO,
  HRNotificationPriorityCode,
  HRNotificationTypeCode,
} from '@/server/types/hr/notifications';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { HRNotificationType, NotificationPriority, PrismaInputJsonValue } from '@/server/types/prisma';

const typeToPrisma: Record<HRNotificationTypeCode, HRNotificationType> = {
  'leave-approval': 'leave-approval',
  'leave-rejection': 'leave-rejection',
  'document-expiry': 'document-expiry',
  'policy-update': 'policy-update',
  'performance-review': 'performance-review',
  'time-entry': 'time-entry',
  'training-assigned': 'training-assigned',
  'training-due': 'training-due',
  'training-completed': 'training-completed',
  'training-overdue': 'training-overdue',
  'system-announcement': 'system-announcement',
  'compliance-reminder': 'compliance-reminder',
  other: 'other',
};

const typeFromPrisma: Record<HRNotificationType, HRNotificationTypeCode> = {
  'leave-approval': 'leave-approval',
  'leave-rejection': 'leave-rejection',
  'document-expiry': 'document-expiry',
  'policy-update': 'policy-update',
  'performance-review': 'performance-review',
  'time-entry': 'time-entry',
  'training-assigned': 'training-assigned',
  'training-due': 'training-due',
  'training-completed': 'training-completed',
  'training-overdue': 'training-overdue',
  'system-announcement': 'system-announcement',
  'compliance-reminder': 'compliance-reminder',
  other: 'other',
};

const priorityToPrisma: Record<HRNotificationPriorityCode, NotificationPriority> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
};

const priorityFromPrisma: Record<NotificationPriority, HRNotificationPriorityCode> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
};

export function toPrismaHRNotificationType(type: HRNotificationTypeCode): HRNotificationType {
  return typeToPrisma[type];
}

export function toPrismaHRNotificationPriority(
  priority: HRNotificationPriorityCode,
): NotificationPriority {
  return priorityToPrisma[priority];
}

export function toDomainHRNotificationType(type: HRNotificationType): HRNotificationTypeCode {
  return typeFromPrisma[type];
}

export function toDomainHRNotificationPriority(
  priority: NotificationPriority,
): HRNotificationPriorityCode {
  return priorityFromPrisma[priority];
}

interface HRNotificationRecord {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  message: string;
  type: HRNotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
  correlationId?: string | null;
  createdByUserId?: string | null;
  dataClassification: DataClassificationLevel;
  residencyTag: DataResidencyZone;
  metadata?: PrismaInputJsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

interface HRNotificationCreatePayload {
  orgId: string;
  userId: string;
  title: string;
  message: string;
  type: HRNotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
  correlationId?: string | null;
  createdByUserId?: string | null;
  dataClassification: DataClassificationLevel;
  residencyTag: DataResidencyZone;
  metadata?: PrismaInputJsonValue;
}

export function mapPrismaHRNotificationToDomain(record: HRNotificationRecord): HRNotificationDTO {
  return {
    id: record.id,
    orgId: record.orgId,
    userId: record.userId,
    title: record.title,
    message: record.message,
    type: toDomainHRNotificationType(record.type),
    priority: toDomainHRNotificationPriority(record.priority),
    isRead: record.isRead,
    readAt: record.readAt ?? undefined,
    actionUrl: record.actionUrl ?? undefined,
    actionLabel: record.actionLabel ?? undefined,
    scheduledFor: record.scheduledFor ?? undefined,
    expiresAt: record.expiresAt ?? undefined,
    correlationId: record.correlationId ?? undefined,
    createdByUserId: record.createdByUserId ?? undefined,
    dataClassification: record.dataClassification,
    residencyTag: record.residencyTag,
    metadata: record.metadata ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapDomainHRNotificationToPrismaCreate(
  input: HRNotificationCreateDTO,
): HRNotificationCreatePayload {
  return {
    orgId: input.orgId,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: toPrismaHRNotificationType(input.type),
    priority: toPrismaHRNotificationPriority(input.priority),
    isRead: input.isRead ?? false,
    readAt: toNullableDate(input.readAt) ?? null,
    actionUrl: input.actionUrl ?? null,
    actionLabel: input.actionLabel ?? null,
    scheduledFor: toNullableDate(input.scheduledFor) ?? null,
    expiresAt: toNullableDate(input.expiresAt) ?? null,
    correlationId: input.correlationId ?? null,
    createdByUserId: input.createdByUserId ?? null,
    dataClassification: input.dataClassification,
    residencyTag: input.residencyTag,
    metadata: input.metadata ? (input.metadata as PrismaInputJsonValue) : undefined,
  } satisfies HRNotificationCreatePayload;
}

function toNullableDate(value: Date | string | null | undefined): Date | null | undefined {
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return undefined;
  }
  return value instanceof Date ? value : new Date(value);
}
