import { PrismaNotificationRepository } from '@/server/repositories/prisma/notifications/prisma-notification-repository';
import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';
import type { NotificationAuditWriter } from '@/server/repositories/contracts/notifications';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { ResendNotificationAdapter } from './adapters/resend-notification-adapter';
import { NovuNotificationAdapter } from './adapters/novu-notification-adapter';
import {
  NotificationComposerService,
  type NotificationComposerDependencies,
} from './notification-composer.service';

const notificationAuditWriter: NotificationAuditWriter = {
  async write(envelope) {
    await recordAuditEvent({
      orgId: envelope.orgId,
      userId: envelope.userId,
      eventType: 'DATA_CHANGE',
      action: 'notification.audit',
      resource: 'notification',
      resourceId: envelope.notificationId,
      payload: envelope,
      correlationId: envelope.auditMetadata.correlationId,
      residencyZone: envelope.residencyTag,
      classification: envelope.dataClassification,
      auditSource: envelope.auditMetadata.auditSource,
    });
  },
};

const notificationRepository = new PrismaNotificationRepository({ auditWriter: notificationAuditWriter });
const preferenceRepository = new PrismaNotificationPreferenceRepository();

const deliveryAdapters = [
  new ResendNotificationAdapter({
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.NOTIFICATION_FROM_EMAIL ?? 'OrgCentral <no-reply@orgcentral.test>',
  }),
  new NovuNotificationAdapter({
    apiKey: process.env.NOVU_API_KEY,
    workflowId: process.env.NOVU_WORKFLOW_ID ?? 'notification',
  }),
];

const defaultDependencies: NotificationComposerDependencies = {
  notificationRepository,
  preferenceRepository,
  deliveryAdapters,
  defaultRetentionPolicyId: process.env.DEFAULT_NOTIFICATION_RETENTION_POLICY_ID ?? 'notifications',
};

let sharedService: NotificationComposerService | null = null;

export function getNotificationComposerService(
  overrides?: Partial<NotificationComposerDependencies>,
): NotificationComposerService {
  if (!sharedService || (overrides && Object.keys(overrides).length)) {
    sharedService = new NotificationComposerService({
      ...defaultDependencies,
      ...overrides,
    });
  }
  return sharedService;
}

export type NotificationComposerContract = Pick<
  NotificationComposerService,
  'composeAndSend' | 'listInbox' | 'markRead' | 'markAllRead' | 'deleteNotification'
>;
