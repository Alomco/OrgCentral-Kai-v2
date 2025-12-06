import type { NotificationCreateInput, NotificationListFilters, NotificationRecord } from '@/server/repositories/notifications/notification-schemas';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS';

export interface DeliveryTarget {
  channel: NotificationChannel;
  to: string;
  provider?: string;
}

export interface NotificationDeliveryPayload {
  orgId: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  actionUrl?: string | null;
  correlationId?: string;
}

export interface NotificationDeliveryResult {
  provider: string;
  channel: NotificationChannel;
  status: 'sent' | 'queued' | 'skipped' | 'failed';
  detail?: string;
  externalId?: string;
}

export interface NotificationDeliveryAdapter {
  readonly provider: string;
  readonly channel: NotificationChannel;
  send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult>;
}

export interface NotificationAbacContext {
  action?: string;
  resourceType?: string;
  resourceAttributes?: Record<string, unknown>;
}

export interface ComposeNotificationInput {
  authorization: RepositoryAuthorizationContext;
  notification: NotificationCreateInput;
  targets?: DeliveryTarget[];
  abac?: NotificationAbacContext;
}

export interface ComposeNotificationResult {
  notification: NotificationRecord;
  deliveries: NotificationDeliveryResult[];
}

export interface NotificationInboxInput {
  authorization: RepositoryAuthorizationContext;
  filters?: NotificationListFilters;
  userId?: string;
}

export interface NotificationInboxResult {
  notifications: NotificationRecord[];
  unreadCount: number;
}

export interface NotificationMutationInput {
  authorization: RepositoryAuthorizationContext;
  notificationId: string;
}

export interface MarkAllNotificationsInput {
  authorization: RepositoryAuthorizationContext;
  userId?: string;
  before?: Date | string;
}
