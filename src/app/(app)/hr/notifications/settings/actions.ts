'use server';

import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { HR_ACTION, HR_PERMISSION_PROFILE, HR_RESOURCE_TYPE } from '@/server/security/authorization';
import { buildHrAuthActionOptions } from '@/server/ui/auth/hr-session';
import { getNotificationPreferencesAction } from '@/server/api-adapters/hr/notifications/get-notification-preferences';
import { updateNotificationPreferenceAction } from '@/server/api-adapters/hr/notifications/update-notification-preference';
import type { NotificationPreference } from '@/server/types/hr-types';

const AUDIT_PREFIX = 'action:hr:notifications:settings';
function isPrismaJsonValue(value: unknown): value is Prisma.JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isPrismaJsonValue);
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isPrismaJsonValue);
  }

  return false;
}

const prismaJsonValueSchema: z.ZodType<Prisma.JsonValue> = z.custom<Prisma.JsonValue>(isPrismaJsonValue, {
  message: 'Invalid JSON value',
});

const updatePreferenceSchema = z.object({
  preferenceId: z.string(),
  enabled: z.boolean().optional(),
  metadata: prismaJsonValueSchema.optional(),
});

export async function getNotificationPreferences(): Promise<ActionState<{ preferences: NotificationPreference[] }>> {
  return toActionState(() =>
    authAction(
      buildHrAuthActionOptions({
        requiredPermissions: HR_PERMISSION_PROFILE.NOTIFICATION_READ,
        auditSource: `${AUDIT_PREFIX}:list`,
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.NOTIFICATION,
        resourceAttributes: { view: 'preferences' },
      }),
      async ({ authorization }) => {
        return getNotificationPreferencesAction({ authorization });
      }
    )
  );
}

export async function updateNotificationPreference(
  input: z.infer<typeof updatePreferenceSchema>,
): Promise<ActionState<{ preference: NotificationPreference | null }>> {
  const parsed = updatePreferenceSchema.parse(input);

  return toActionState(() =>
    authAction(
      buildHrAuthActionOptions({
        requiredPermissions: HR_PERMISSION_PROFILE.NOTIFICATION_MANAGE,
        auditSource: `${AUDIT_PREFIX}:update`,
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.NOTIFICATION,
        resourceAttributes: { preferenceId: parsed.preferenceId },
      }),
      async ({ authorization }) => {
        return updateNotificationPreferenceAction({
          authorization,
          preferenceId: parsed.preferenceId,
          updates: {
            enabled: parsed.enabled,
            metadata: parsed.metadata,
          },
        });
      }
    )
  );
}
