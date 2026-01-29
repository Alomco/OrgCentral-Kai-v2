'use server';

import { z } from 'zod';
import { headers } from 'next/headers';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { markHrNotificationReadAction as markReadAdapter } from '@/server/api-adapters/hr/notifications/mark-hr-notification-read';
import { markAllHrNotificationsReadAction as markAllReadAdapter } from '@/server/api-adapters/hr/notifications/mark-all-hr-notifications-read';
import { deleteHrNotificationAction as deleteAdapter } from '@/server/api-adapters/hr/notifications/delete-hr-notification';
import { getHrNotificationsAction } from '@/server/api-adapters/hr/notifications/get-hr-notifications';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import { notificationFilterSchema, type NotificationFilters } from './_schemas/filter-schema';
import type { NotificationSummary } from '@/components/notifications/notification-item';

const AUDIT_PREFIX = 'action:hr:notifications';
const RESOURCE_TYPE = 'hr.notifications';
const NOTIFICATIONS_PATH = '/hr/notifications';
const NOTIFICATIONS_LIMIT = 50;

const markReadSchema = z.object({
  notificationId: z.string(),
});

const markAllReadSchema = z.object({
  before: z.iso.datetime().optional(),
});

const deleteSchema = z.object({
  notificationId: z.string(),
});

export async function listHrNotifications(
  input: Partial<NotificationFilters> = {},
): Promise<{ notifications: NotificationSummary[]; unreadCount: number }> {
  const headerStore = await headers();
  const { authorization, session } = await getSessionContext(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['read'] },
      auditSource: `${AUDIT_PREFIX}:list`,
      action: 'list',
      resourceType: RESOURCE_TYPE,
    },
  );

  const filters = notificationFilterSchema.parse(input);
  const limit = Math.min(filters.limit ?? NOTIFICATIONS_LIMIT, NOTIFICATIONS_LIMIT);
  const result = await getHrNotificationsAction({
    authorization,
    userId: session.user.id,
    filters: {
      unreadOnly: filters.unreadOnly,
      types: filters.type ? [filters.type] : undefined,
      priorities: filters.priority ? [filters.priority] : undefined,
      limit,
    },
  });

  const notifications = result.notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    actionUrl: notification.actionUrl ?? undefined,
    actionLabel: notification.actionLabel ?? undefined,
  }));

  return { notifications, unreadCount: result.unreadCount };
}

export async function markHrNotificationRead(
  input: z.infer<typeof markReadSchema>,
): Promise<ActionState<{ notification: HRNotificationDTO }>> {
  const parsed = markReadSchema.parse(input);

  return toActionState(() =>
    authAction(
      {
        auditSource: `${AUDIT_PREFIX}:mark-read`,
        action: 'update',
        resourceType: RESOURCE_TYPE,
        resourceAttributes: { notificationId: parsed.notificationId },
      },
      async ({ authorization }) => {
        const result = await markReadAdapter({
          authorization,
          notificationId: parsed.notificationId,
          readAt: new Date(),
        });

        after(() => {
          revalidatePath(NOTIFICATIONS_PATH);
        });

        return result;
      }
    )
  );
}

export async function markAllHrNotificationsRead(
  input: z.infer<typeof markAllReadSchema> = {},
): Promise<ActionState<{ count: number }>> {
  const parsed = markAllReadSchema.parse(input);

  return toActionState(() =>
    authAction(
      {
        auditSource: `${AUDIT_PREFIX}:mark-all-read`,
        action: 'update',
        resourceType: RESOURCE_TYPE,
      },
      async ({ authorization }) => {
        const result = await markAllReadAdapter({
          authorization,
          before: parsed.before,
        });

        after(() => {
          revalidatePath(NOTIFICATIONS_PATH);
        });

        return { count: result.updatedCount };
      }
    )
  );
}

export async function deleteHrNotification(
  input: z.infer<typeof deleteSchema>,
): Promise<ActionState<{ success: true }>> {
  const parsed = deleteSchema.parse(input);

  return toActionState(() =>
    authAction(
      {
        auditSource: `${AUDIT_PREFIX}:delete`,
        action: 'delete',
        resourceType: RESOURCE_TYPE,
        resourceAttributes: { notificationId: parsed.notificationId },
      },
      async ({ authorization }) => {
        const result = await deleteAdapter({
          authorization,
          notificationId: parsed.notificationId,
        });

        after(() => {
          revalidatePath(NOTIFICATIONS_PATH);
        });

        return result;
      }
    )
  );
}
