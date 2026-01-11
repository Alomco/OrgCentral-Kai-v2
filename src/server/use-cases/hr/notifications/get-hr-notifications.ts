import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationDTO, HRNotificationListFilters } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from '@/server/services/hr/notifications/hr-notification-service';

// Use-case: list HR notifications for a user or org through HR notification services with filters.

export interface GetHrNotificationsInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    filters?: HRNotificationListFilters;
}

export interface GetHrNotificationsResult {
    notifications: HRNotificationDTO[];
    unreadCount: number;
}

export interface GetHrNotificationsDependencies {
    service?: HrNotificationService;
}

export async function getHrNotifications(
    dependencies: GetHrNotificationsDependencies,
    input: GetHrNotificationsInput,
): Promise<GetHrNotificationsResult> {
    const service = dependencies.service ?? getHrNotificationService();
    return service.listNotifications(input);
}
