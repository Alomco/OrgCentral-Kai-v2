import { NotificationComposerService, type NotificationComposerDependencies } from './notification-composer.service';
import type { NotificationComposerContract } from '@/server/repositories/contracts/notifications/notification-composer-contract';
import { buildNotificationComposerServiceDependencies, type NotificationComposerServiceDependencyOptions } from '@/server/repositories/providers/platform/notification-composer-service-dependencies';
import { ResendNotificationAdapter } from './adapters/resend-notification-adapter';

const defaultRetentionPolicyId =
  process.env.DEFAULT_NOTIFICATION_RETENTION_POLICY_ID ?? 'notifications';

const createDefaultDeliveryAdapters = () => [
  new ResendNotificationAdapter({
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.NOTIFICATION_FROM_EMAIL ?? 'OrgCentral <no-reply@orgcentral.test>',
  }),
];

const defaultSharedService = (() => {
  const dependencies = buildNotificationComposerServiceDependencies();
  return new NotificationComposerService({
    ...dependencies,
    deliveryAdapters: createDefaultDeliveryAdapters(),
    defaultRetentionPolicyId,
  });
})();

export function getNotificationComposerService(
  overrides?: Partial<NotificationComposerDependencies>,
  options?: NotificationComposerServiceDependencyOptions,
): NotificationComposerService {
  // If no overrides are provided, return the shared instance
  if (!overrides || Object.keys(overrides).length === 0) {
    return defaultSharedService;
  }

  // If overrides are provided, create a new instance with those overrides
  const dependencies = buildNotificationComposerServiceDependencies({
    prismaOptions: options?.prismaOptions,
    overrides,
  });
  return new NotificationComposerService({
    ...dependencies,
    deliveryAdapters: overrides.deliveryAdapters ?? createDefaultDeliveryAdapters(),
    defaultRetentionPolicyId: overrides.defaultRetentionPolicyId ?? defaultRetentionPolicyId,
    guard: overrides.guard,
    auditRecorder: overrides.auditRecorder,
    orgSettingsLoader: overrides.orgSettingsLoader,
  });
}

export type { NotificationComposerContract };
