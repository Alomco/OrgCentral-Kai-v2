import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getNotificationComposerService } from '@/server/services/platform/notifications/notification-composer.provider';
import {
  notificationCreateSchema,
  type NotificationCreateInput,
} from '@/server/repositories/notifications/notification-schemas';
import type { NotificationInboxResult } from '@/server/services/platform/notifications/notification-types';

const composer = getNotificationComposerService();

const composeRequestSchema = z.object({
  notification: notificationCreateSchema.omit({
    orgId: true,
    dataClassification: true,
    residencyTag: true,
    auditSource: true,
    createdByUserId: true,
    correlationId: true,
  }).partial({
    retentionPolicyId: true,
  }),
  targets: z
    .array(
      z.object({
        channel: z.enum(['EMAIL', 'IN_APP', 'SMS']),
        to: z.string(),
        provider: z.string().optional(),
      }),
    )
    .optional(),
});

export interface ListNotificationsResult {
  success: true;
  data: NotificationInboxResult;
}

export interface ComposeNotificationResult {
  success: true;
  data: Awaited<ReturnType<typeof composer.composeAndSend>>;
}

async function readJson<T = unknown>(request: Request, fallback: T): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return fallback;
  }
}

export async function listNotificationsController(request: Request): Promise<ListNotificationsResult> {
  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      auditSource: 'api:notifications:list',
      action: 'notifications:list',
      resourceType: 'notification',
    },
  );

  const data = await composer.listInbox({ authorization });
  return { success: true, data };
}

export async function composeNotificationController(
  request: Request,
): Promise<ComposeNotificationResult> {
  const raw = await readJson(request, {});
  const parsed = composeRequestSchema.parse(raw);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      auditSource: 'api:notifications:compose',
      action: 'notifications:compose',
      resourceType: 'notification',
    },
  );

  const notification: NotificationCreateInput = {
    ...parsed.notification,
    orgId: authorization.orgId,
    dataClassification: authorization.dataClassification,
    residencyTag: authorization.dataResidency,
    auditSource: authorization.auditSource,
    createdByUserId: authorization.userId,
    correlationId: authorization.correlationId,
    retentionPolicyId:
      parsed.notification.retentionPolicyId ??
      process.env.DEFAULT_NOTIFICATION_RETENTION_POLICY_ID ??
      'notifications',
  };

  const data = await composer.composeAndSend({
    authorization,
    notification,
    targets: parsed.targets,
  });

  return { success: true, data };
}
