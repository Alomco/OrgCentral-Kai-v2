import type {
  HRNotificationCreateDTO,
  HRNotificationDTO,
  HRNotificationPriorityCode,
  HRNotificationTypeCode,
} from '@/server/types/hr/notifications';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { PrismaInputJsonValue } from '@/server/types/prisma';
import { HRNotificationType, NotificationPriority } from '@/server/types/prisma';

const typeToPrisma: Record<HRNotificationTypeCode, HRNotificationType> = {
  'leave-approval': HRNotificationType.LEAVE_APPROVAL,
  'leave-rejection': HRNotificationType.LEAVE_REJECTION,
  'document-expiry': HRNotificationType.DOCUMENT_EXPIRY,
  'policy-update': HRNotificationType.POLICY_UPDATE,
  'performance-review': HRNotificationType.PERFORMANCE_REVIEW,
  'time-entry': HRNotificationType.TIME_ENTRY,
  'training-assigned': HRNotificationType.TRAINING_ASSIGNED,
  'training-due': HRNotificationType.TRAINING_DUE,
  'training-completed': HRNotificationType.TRAINING_COMPLETED,
  'training-overdue': HRNotificationType.TRAINING_OVERDUE,
  'system-announcement': HRNotificationType.SYSTEM_ANNOUNCEMENT,
  'compliance-reminder': HRNotificationType.COMPLIANCE_REMINDER,
  other: HRNotificationType.OTHER,
};

const typeFromPrisma: Record<HRNotificationType, HRNotificationTypeCode> = {
  [HRNotificationType.LEAVE_APPROVAL]: 'leave-approval',
  [HRNotificationType.LEAVE_REJECTION]: 'leave-rejection',
  [HRNotificationType.DOCUMENT_EXPIRY]: 'document-expiry',
  [HRNotificationType.POLICY_UPDATE]: 'policy-update',
  [HRNotificationType.PERFORMANCE_REVIEW]: 'performance-review',
  [HRNotificationType.TIME_ENTRY]: 'time-entry',
  [HRNotificationType.TRAINING_ASSIGNED]: 'training-assigned',
  [HRNotificationType.TRAINING_DUE]: 'training-due',
  [HRNotificationType.TRAINING_COMPLETED]: 'training-completed',
  [HRNotificationType.TRAINING_OVERDUE]: 'training-overdue',
  [HRNotificationType.SYSTEM_ANNOUNCEMENT]: 'system-announcement',
  [HRNotificationType.COMPLIANCE_REMINDER]: 'compliance-reminder',
  [HRNotificationType.OTHER]: 'other',
};

const priorityToPrisma: Record<HRNotificationPriorityCode, NotificationPriority> = {
  low: NotificationPriority.LOW,
  medium: NotificationPriority.MEDIUM,
  high: NotificationPriority.HIGH,
  urgent: NotificationPriority.URGENT,
};

const priorityFromPrisma: Record<NotificationPriority, HRNotificationPriorityCode> = {
  [NotificationPriority.LOW]: 'low',
  [NotificationPriority.MEDIUM]: 'medium',
  [NotificationPriority.HIGH]: 'high',
  [NotificationPriority.URGENT]: 'urgent',
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
