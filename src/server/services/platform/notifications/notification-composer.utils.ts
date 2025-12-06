import type { ResultAsync } from 'neverthrow';
import { NOTIFICATION_SCHEMA_VERSION } from '@/server/repositories/notifications/notification-schemas';
import type { NotificationCreateInput, NotificationRecord } from '@/server/repositories/notifications/notification-schemas';
import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type {
  DeliveryTarget,
  NotificationDeliveryAdapter,
  NotificationDeliveryPayload,
  NotificationDeliveryResult,
} from './notification-types';

type NormalizableNotificationInput = Pick<
  NotificationCreateInput,
  'userId' | 'title' | 'body' | 'topic' | 'priority'
> &
  Partial<Omit<NotificationCreateInput, 'userId' | 'title' | 'body' | 'topic' | 'priority'>>;

export function normalizeNotificationInput(
  authorization: RepositoryAuthorizationContext,
  notification: NormalizableNotificationInput,
  defaultRetentionPolicyId: string,
): NotificationCreateInput {
  return {
    ...notification,
    orgId: authorization.orgId,
    retentionPolicyId: notification.retentionPolicyId ?? defaultRetentionPolicyId,
    // auditSource may be overridden by caller; fall back to tenant context when omitted
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    auditSource: notification.auditSource ?? authorization.auditSource ?? 'platform.notifications',
    dataClassification: notification.dataClassification ?? authorization.dataClassification,
    residencyTag: notification.residencyTag ?? authorization.dataResidency,
    createdByUserId: notification.createdByUserId ?? authorization.userId,
    correlationId: notification.correlationId ?? authorization.correlationId,
    schemaVersion: notification.schemaVersion ?? NOTIFICATION_SCHEMA_VERSION,
    isRead: notification.isRead ?? false,
    readAt: notification.readAt ?? null,
    metadata: notification.metadata ?? null,
    auditTrail: notification.auditTrail ?? null,
  };
}

export async function loadNotificationPreferences(
  repository: INotificationPreferenceRepository | undefined,
  orgId: string,
  userId: string,
): Promise<NotificationPreference[]> {
  if (!repository) {
    return [];
  }
  return repository.getNotificationPreferencesByUser(orgId, userId);
}

export async function dispatchNotificationDeliveries(
  adapters: NotificationDeliveryAdapter[],
  notification: NotificationRecord,
  targets: DeliveryTarget[],
  preferences: NotificationPreference[],
  logger: { error: (message: string, metadata?: Record<string, unknown>) => void },
): Promise<NotificationDeliveryResult[]> {
  const disabledChannels = new Set(
    preferences.filter((pref) => !pref.enabled).map((pref) => pref.channel as string),
  );

  const deliveries: NotificationDeliveryResult[] = [];

  for (const target of targets) {
    if (disabledChannels.has(target.channel)) {
      deliveries.push({
        provider: target.channel.toLowerCase(),
        channel: target.channel,
        status: 'skipped',
        detail: 'channel disabled by user preference',
      });
      continue;
    }

    const adapter = target.provider
      ? adapters.find((candidate) => candidate.provider === target.provider)
      : adapters.find((candidate) => candidate.channel === target.channel);

    if (!adapter) {
      deliveries.push({
        provider: target.channel.toLowerCase(),
        channel: target.channel,
        status: 'skipped',
        detail: 'no adapter configured',
      });
      continue;
    }

    try {
      const payload: NotificationDeliveryPayload = {
        orgId: notification.orgId,
        userId: notification.userId,
        to: target.to,
        subject: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl ?? undefined,
        correlationId: notification.correlationId ?? undefined,
      };
      deliveries.push(await adapter.send(payload));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'delivery failed';
      logger.error('Notification delivery failed', { error: message, provider: adapter.provider });
      deliveries.push({
        provider: adapter.provider,
        channel: target.channel,
        status: 'failed',
        detail: message,
      });
    }
  }

  return deliveries;
}

export function makeStubNotification(
  authorization: RepositoryAuthorizationContext,
  userId: string,
  defaultRetentionPolicyId: string,
): NotificationRecord {
  return {
    id: '',
    orgId: authorization.orgId,
    userId,
    title: 'placeholder',
    body: '',
    topic: 'other',
    priority: 'low',
    isRead: false,
    retentionPolicyId: defaultRetentionPolicyId,
    dataClassification: authorization.dataClassification,
    residencyTag: authorization.dataResidency,
    auditSource: authorization.auditSource,
    schemaVersion: 1,
    metadata: null,
    auditTrail: null,
    readAt: null,
    actionUrl: null,
    actionLabel: null,
    scheduledFor: null,
    expiresAt: null,
    correlationId: null,
    createdByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function unwrapResult<T>(result: ResultAsync<T, Error>): Promise<T> {
  return result.match(
    (value) => value,
    (error) => {
      throw error;
    },
  );
}

export function buildServiceContext(
  authorization: RepositoryAuthorizationContext,
  metadata?: Record<string, unknown>,
): ServiceExecutionContext {
  return {
    authorization,
    correlationId: authorization.correlationId,
    metadata: { auditSource: authorization.auditSource, ...metadata },
  };
}
