import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from '@/server/services/hr/notifications/hr-notification-service';

// Use-case: mark a single HR notification as read using HR notification services.

export interface MarkHrNotificationReadInput {
    authorization: RepositoryAuthorizationContext;
    notificationId: string;
    readAt?: Date | string;
}

export interface MarkHrNotificationReadResult {
    notification: HRNotificationDTO;
}

export interface MarkHrNotificationReadDependencies {
    service?: HrNotificationService;
}

export async function markHrNotificationRead(
    dependencies: MarkHrNotificationReadDependencies,
    input: MarkHrNotificationReadInput,
): Promise<MarkHrNotificationReadResult> {
    const service = dependencies.service ?? getHrNotificationService();
    return service.markNotificationRead(input);
}
