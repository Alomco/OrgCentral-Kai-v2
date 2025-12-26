'use server';

import { z } from 'zod';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import { HR_NOTIFICATION_PRIORITY_VALUES, HR_NOTIFICATION_TYPE_VALUES } from '@/server/types/hr/notifications';

const AUDIT_PREFIX = 'action:hr:notifications:emit';
const RESOURCE_TYPE = 'hr.notifications';

const emitNotificationInputSchema = z
    .object({
        userId: z.string().min(1, { message: 'userId is required' }),
        title: z.string().min(1, { message: 'title is required' }),
        message: z.string().min(1, { message: 'message is required' }),
        type: z
            .enum(HR_NOTIFICATION_TYPE_VALUES as unknown as [
                (typeof HR_NOTIFICATION_TYPE_VALUES)[number],
                ...(typeof HR_NOTIFICATION_TYPE_VALUES)[number][],
            ])
            .optional(),
        priority: z
            .enum(HR_NOTIFICATION_PRIORITY_VALUES as unknown as [
                (typeof HR_NOTIFICATION_PRIORITY_VALUES)[number],
                ...(typeof HR_NOTIFICATION_PRIORITY_VALUES)[number][],
            ])
            .optional(),
        actionUrl: z.string().optional().nullable(),
        metadata: z.record(z.unknown()).optional(),
    })
    .strict();

export type EmitNotificationInput = z.infer<typeof emitNotificationInputSchema>;

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

                await emitHrNotification(
                    {},
                    {
                        authorization,
                        notification: {
                            userId: shaped.userId,
                            title: shaped.title,
                            message: shaped.message,
                            type: shaped.type ?? 'system-announcement',
                            priority: shaped.priority ?? 'medium',
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
