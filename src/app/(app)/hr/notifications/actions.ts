'use server';

import { z } from 'zod';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { markHrNotificationReadAction as markReadAdapter } from '@/server/api-adapters/hr/notifications/mark-hr-notification-read';
import { markAllHrNotificationsReadAction as markAllReadAdapter } from '@/server/api-adapters/hr/notifications/mark-all-hr-notifications-read';
import { deleteHrNotificationAction as deleteAdapter } from '@/server/api-adapters/hr/notifications/delete-hr-notification';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';

const AUDIT_PREFIX = 'action:hr:notifications';
const RESOURCE_TYPE = 'hr.notifications';

const markReadSchema = z.object({
  notificationId: z.string(),
});

const markAllReadSchema = z.object({
  before: z.iso.datetime().optional(),
});

const deleteSchema = z.object({
  notificationId: z.string(),
});

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
        return markReadAdapter({
          authorization,
          notificationId: parsed.notificationId,
          readAt: new Date(),
        });
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
        return deleteAdapter({
          authorization,
          notificationId: parsed.notificationId,
        });
      }
    )
  );
}
