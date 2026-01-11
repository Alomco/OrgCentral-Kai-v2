import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from '@/server/services/hr/notifications/hr-notification-service';

// Use-case: delete an HR notification via HR notification services under tenant guard.

export interface DeleteHrNotificationInput {
    authorization: RepositoryAuthorizationContext;
    notificationId: string;
}

export interface DeleteHrNotificationResult {
    success: true;
}

export interface DeleteHrNotificationDependencies {
    service?: HrNotificationService;
}

export async function deleteHrNotification(
    dependencies: DeleteHrNotificationDependencies,
    input: DeleteHrNotificationInput,
): Promise<DeleteHrNotificationResult> {
    const service = dependencies.service ?? getHrNotificationService();
    return service.deleteNotification(input);
}
