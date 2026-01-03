import type { NotificationTopicCode } from '@/server/repositories/notifications/notification-schemas';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';

const SECURITY_ALERT_TOPICS = new Set<NotificationTopicCode>([
  'policy-update',
  'compliance-reminder',
  'document-expiry',
]);
const PRODUCT_UPDATE_TOPICS = new Set<NotificationTopicCode>(['system-announcement']);
const ADMIN_DIGEST_TOPICS = new Set<NotificationTopicCode>(['broadcast']);

export function shouldDeliverNotification(
  settings: OrgSettings,
  topic: NotificationTopicCode,
): boolean {
  if (SECURITY_ALERT_TOPICS.has(topic)) {
    return settings.notifications.securityAlerts;
  }
  if (ADMIN_DIGEST_TOPICS.has(topic)) {
    return settings.notifications.adminDigest !== 'off';
  }
  if (PRODUCT_UPDATE_TOPICS.has(topic)) {
    return settings.notifications.productUpdates;
  }
  return true;
}
