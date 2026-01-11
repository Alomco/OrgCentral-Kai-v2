import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationDTO, HRNotificationListFilters } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import { registerHrNotificationTag } from '@/server/lib/cache-tags/hr-notifications';

export interface GetHrNotificationsActionInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    filters?: HRNotificationListFilters;
}

export interface GetHrNotificationsActionResult {
    notifications: HRNotificationDTO[];
    unreadCount: number;
}

// API adapter: list HR notifications via HrNotificationService and register cache tag for the tenant scope.
export async function getHrNotificationsAction(
    input: GetHrNotificationsActionInput,
): Promise<GetHrNotificationsActionResult> {
    const service = getHrNotificationService();
    const result = await service.listNotifications(input);

    registerHrNotificationTag({
        orgId: input.authorization.orgId,
        classification: input.authorization.dataClassification,
        residency: input.authorization.dataResidency,
    });

    return result;
}
