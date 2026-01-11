import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import { invalidateHrNotifications } from '@/server/lib/cache-tags/hr-notifications';

export interface MarkHrNotificationReadActionInput {
    authorization: RepositoryAuthorizationContext;
    notificationId: string;
    readAt?: Date | string;
}

export interface MarkHrNotificationReadActionResult {
    notification: HRNotificationDTO;
}

// API adapter: mark a single HR notification as read using HrNotificationService and invalidate cache.
export async function markHrNotificationReadAction(
    input: MarkHrNotificationReadActionInput,
): Promise<MarkHrNotificationReadActionResult> {
    const service = getHrNotificationService();
    const result = await service.markNotificationRead(input);

    await invalidateHrNotifications({
        orgId: input.authorization.orgId,
        classification: input.authorization.dataClassification,
        residency: input.authorization.dataResidency,
    });

    return result;
}
