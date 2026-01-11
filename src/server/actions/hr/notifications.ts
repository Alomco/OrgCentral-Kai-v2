'use server';

import { z } from 'zod';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import {
    HR_NOTIFICATION_PRIORITY_VALUES,
    HR_NOTIFICATION_TYPE_VALUES,
    type HRNotificationPriorityCode,
    type HRNotificationTypeCode,
} from '@/server/types/hr/notifications';

const AUDIT_PREFIX = 'action:hr:notifications:emit';
const RESOURCE_TYPE = 'hr.notifications';
const DEFAULT_NOTIFICATION_TYPE: HRNotificationTypeCode = 'system-announcement';
const DEFAULT_NOTIFICATION_PRIORITY: HRNotificationPriorityCode = 'medium';

const emitNotificationInputSchema = z
    .object({
        userId: z.string().min(1, { message: 'userId is required' }),
        title: z.string().min(1, { message: 'title is required' }),
        message: z.string().min(1, { message: 'message is required' }),
        type: z.enum(HR_NOTIFICATION_TYPE_VALUES).optional(),
        priority: z.enum(HR_NOTIFICATION_PRIORITY_VALUES).optional(),
        actionUrl: z.string().optional().nullable(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export async function emitHrNotificationAction(
    input: unknown,
): Promise<ActionState<{ success: true }>> {
    const parsedForAudit = emitNotificationInputSchema.safeParse(input);

    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { organization: ['update'] },
                auditSource: AUDIT_PREFIX,
                action: 'create',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: {
                    targetUserId: parsedForAudit.success ? parsedForAudit.data.userId : undefined,
                    type: parsedForAudit.success ? parsedForAudit.data.type : undefined,
                },
            },
            async ({ authorization }) => {
                const shaped = emitNotificationInputSchema.parse(input);
                const type: HRNotificationTypeCode = shaped.type ?? DEFAULT_NOTIFICATION_TYPE;
                const priority: HRNotificationPriorityCode =
                    shaped.priority ?? DEFAULT_NOTIFICATION_PRIORITY;

                await emitHrNotification(
                    {},
                    {
                        authorization,
                        notification: {
                            userId: shaped.userId,
                            title: shaped.title,
                            message: shaped.message,
                            type,
                            priority,
                            actionUrl: shaped.actionUrl ?? undefined,
                            metadata: shaped.metadata,
                        },
                    },
                );

                return { success: true };
            },
        ),
    );
}
