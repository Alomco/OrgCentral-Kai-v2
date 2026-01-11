import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService, MarkAllNotificationsReadResult } from '@/server/services/hr/notifications/hr-notification-service';

// Use-case: mark all HR notifications as read for a user via HR notification services.

export interface MarkAllHrNotificationsReadInput {
    authorization: RepositoryAuthorizationContext;
    before?: Date | string;
    userId?: string;
}

export interface MarkAllHrNotificationsReadDependencies {
    service?: HrNotificationService;
}

export async function markAllHrNotificationsRead(
    dependencies: MarkAllHrNotificationsReadDependencies,
    input: MarkAllHrNotificationsReadInput,
): Promise<MarkAllNotificationsReadResult> {
    const service = dependencies.service ?? getHrNotificationService();
    return service.markAllNotificationsRead(input);
}
