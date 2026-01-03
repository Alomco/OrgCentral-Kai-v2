import type { NotificationRecord } from '@/server/repositories/notifications/notification-schemas';
import type { INotificationRepository } from '@/server/repositories/contracts/notifications';
import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertOrgAccessWithAbac, type OrgAccessInput } from '@/server/security/guards';
import { recordAuditEvent, type AuditEventPayload } from '@/server/logging/audit-logger';
import { registerNotificationCache } from '@/server/repositories/notifications/notification-cache';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { loadOrgSettings } from '@/server/services/org/settings/org-settings-store';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';
import { shouldDeliverNotification } from './notification-delivery-policy';
import {
  type ComposeNotificationInput,
  type ComposeNotificationResult,
  type MarkAllNotificationsInput,
  type NormalizableNotificationInput,
  type NotificationAbacContext,
  type NotificationDeliveryAdapter,
  type NotificationDeliveryResult,
  type NotificationInboxInput,
  type NotificationInboxResult,
  type NotificationMutationInput,
} from './notification-types';
import {
  buildServiceContext,
  dispatchNotificationDeliveries,
  loadNotificationPreferences,
  makeStubNotification,
  normalizeNotificationInput,
  unwrapResult,
} from './notification-composer.utils';

export interface NotificationComposerDependencies {
  notificationRepository: INotificationRepository;
  preferenceRepository?: INotificationPreferenceRepository;
  deliveryAdapters?: NotificationDeliveryAdapter[];
  guard?: (input: OrgAccessInput) => Promise<unknown>;
  auditRecorder?: (event: AuditEventPayload) => Promise<void>;
  orgSettingsLoader?: (orgId: string) => Promise<OrgSettings>;
  defaultRetentionPolicyId: string;
}

export class NotificationComposerService extends AbstractBaseService {
  private readonly repo: INotificationRepository;
  private readonly preferenceRepo?: INotificationPreferenceRepository;
  private readonly adapters: NotificationDeliveryAdapter[];
  private readonly guard: (input: OrgAccessInput) => Promise<unknown>;
  private readonly auditRecorder: (event: AuditEventPayload) => Promise<void>;
  private readonly orgSettingsLoader: (orgId: string) => Promise<OrgSettings>;
  private readonly defaultRetentionPolicyId: string;

  constructor(private readonly dependencies: NotificationComposerDependencies) {
    super();
    this.repo = dependencies.notificationRepository;
    this.preferenceRepo = dependencies.preferenceRepository;
    this.adapters = dependencies.deliveryAdapters ?? [];
    this.guard = dependencies.guard ?? assertOrgAccessWithAbac;
    this.auditRecorder = dependencies.auditRecorder ?? recordAuditEvent;
    this.orgSettingsLoader = dependencies.orgSettingsLoader ?? loadOrgSettings;
    this.defaultRetentionPolicyId = dependencies.defaultRetentionPolicyId;
  }

  async composeAndSend(input: ComposeNotificationInput): Promise<ComposeNotificationResult> {
    await this.enforceAccess(input.authorization, input.abac, input.notification);
    const createInput = normalizeNotificationInput(
      input.authorization,
      input.notification,
      this.defaultRetentionPolicyId,
    );
    const context = buildServiceContext(input.authorization, {
      topic: createInput.topic,
      priority: createInput.priority,
      targetUserId: createInput.userId,
    });

    return this.executeInServiceContext(context, 'platform.notifications.compose', async () => {
      const orgSettings = await this.orgSettingsLoader(createInput.orgId);
      const allowDelivery = shouldDeliverNotification(orgSettings, createInput.topic);
      const preferences = allowDelivery
        ? await loadNotificationPreferences(this.preferenceRepo, createInput.orgId, createInput.userId)
        : [];
      const notification = await unwrapResult(
        this.repo.createNotification(input.authorization, createInput),
      );
      registerNotificationCache({
        orgId: input.authorization.orgId,
        classification: input.authorization.dataClassification,
        residency: input.authorization.dataResidency,
      });
      const targets = input.targets ?? [];

      const suppressedDeliveries: NotificationDeliveryResult[] = targets.map((target) => ({
        provider: target.provider ?? target.channel.toLowerCase(),
        channel: target.channel,
        status: 'skipped',
        detail: 'suppressed by org notification settings',
      }));

      const deliveries = allowDelivery
        ? await dispatchNotificationDeliveries(
            this.adapters,
            notification,
            targets,
            preferences,
            this.logger,
          )
        : suppressedDeliveries;
      await this.audit(notification, input.authorization, deliveries, allowDelivery ? 'compose' : 'suppressed');

      return { notification, deliveries };
    });
  }

  async listInbox(input: NotificationInboxInput): Promise<NotificationInboxResult> {
    await this.enforceAccess(input.authorization, {
      action: 'notifications:list',
      resourceType: 'notification',
      resourceAttributes: { targetUserId: input.userId ?? input.authorization.userId },
    });
    const targetUser = input.userId ?? input.authorization.userId;
    const context = buildServiceContext(input.authorization, {
      targetUserId: targetUser,
    });

    return this.executeInServiceContext(context, 'platform.notifications.list', async () => {
      const notifications = await unwrapResult(
        this.repo.listNotifications(input.authorization, targetUser, input.filters),
      );
      const unreadCount = notifications.filter((item) => !item.isRead).length;
      registerNotificationCache({
        orgId: input.authorization.orgId,
        classification: input.authorization.dataClassification,
        residency: input.authorization.dataResidency,
      });
      return { notifications, unreadCount };
    });
  }

  async markRead(input: NotificationMutationInput): Promise<NotificationRecord> {
    await this.enforceAccess(input.authorization, { action: 'notifications:read', resourceType: 'notification' });
    const context = buildServiceContext(input.authorization, {
      notificationId: input.notificationId,
    });

    return this.executeInServiceContext(context, 'platform.notifications.read', async () => {
      const notification = await unwrapResult(
        this.repo.markRead(input.authorization, input.notificationId, new Date()),
      );
      await this.audit(notification, input.authorization, [], 'read');
      return notification;
    });
  }

  async markAllRead(input: MarkAllNotificationsInput): Promise<number> {
    await this.enforceAccess(input.authorization, {
      action: 'notifications:read-all',
      resourceType: 'notification',
    });
    const targetUser = input.userId ?? input.authorization.userId;
    const context = buildServiceContext(input.authorization, {
      targetUserId: targetUser,
    });

    return this.executeInServiceContext(context, 'platform.notifications.read-all', async () => {
      const count = await unwrapResult(
        this.repo.markAllRead(input.authorization, targetUser, input.before ? new Date(input.before) : undefined),
      );
      await this.audit(
        {
          ...makeStubNotification(input.authorization, targetUser, this.defaultRetentionPolicyId),
          id: 'bulk',
        },
        input.authorization,
        [],
        'read-all',
      );
      return count;
    });
  }

  async deleteNotification(input: NotificationMutationInput): Promise<void> {
    await this.enforceAccess(input.authorization, {
      action: 'notifications:delete',
      resourceType: 'notification',
    });
    const context = buildServiceContext(input.authorization, {
      notificationId: input.notificationId,
    });

    await this.executeInServiceContext(context, 'platform.notifications.delete', async () => {
      await unwrapResult(this.repo.deleteNotification(input.authorization, input.notificationId));
      await this.audit(
        {
          ...makeStubNotification(input.authorization, input.authorization.userId, this.defaultRetentionPolicyId),
          id: input.notificationId,
        },
        input.authorization,
        [],
        'delete',
      );
    });
  }

  private async enforceAccess(
    authorization: RepositoryAuthorizationContext,
    abac?: NotificationAbacContext,
    notification?: NormalizableNotificationInput,
  ): Promise<void> {
    const resourceAttributes: Record<string, unknown> = {
      ...abac?.resourceAttributes,
      topic: notification?.topic ?? abac?.resourceAttributes?.topic,
      targetUserId: notification?.userId ?? abac?.resourceAttributes?.targetUserId,
    };
    await this.guard({
      orgId: authorization.orgId,
      userId: authorization.userId,
      auditSource: authorization.auditSource,
      correlationId: authorization.correlationId,
      action: abac?.action ?? 'notifications:compose',
      resourceType: abac?.resourceType ?? 'notification',
      resourceAttributes,
    });
  }

  private async audit(
    notification: NotificationRecord,
    authorization: RepositoryAuthorizationContext,
    deliveries: NotificationDeliveryResult[],
    action: string,
  ): Promise<void> {
    await this.auditRecorder({
      orgId: authorization.orgId,
      userId: authorization.userId,
      eventType: 'DATA_CHANGE',
      action: `notification.${action}`,
      resource: 'notification',
      resourceId: notification.id,
      payload: {
        notificationId: notification.id,
        topic: notification.topic,
        priority: notification.priority,
        deliveries,
      },
      correlationId: authorization.correlationId,
      residencyZone: authorization.dataResidency,
      classification: authorization.dataClassification,
      auditSource: authorization.auditSource,
    });
  }
}
