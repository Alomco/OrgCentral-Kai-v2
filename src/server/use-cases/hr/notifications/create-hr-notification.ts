import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationCreateDTO, HRNotificationDTO } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from '@/server/services/hr/notifications/hr-notification-service';

// Use-case: create an HR notification for a user via HR notification services with guard enforcement.

export interface CreateHrNotificationInput {
    authorization: RepositoryAuthorizationContext;
    notification: Omit<
        HRNotificationCreateDTO,
        'orgId' | 'dataClassification' | 'residencyTag' | 'createdByUserId' | 'correlationId'
    > &
    Partial<
        Pick<
            HRNotificationCreateDTO,
            'dataClassification' | 'residencyTag' | 'createdByUserId' | 'correlationId'
        >
    >;
}

export interface CreateHrNotificationResult {
    notification: HRNotificationDTO;
}

export interface CreateHrNotificationDependencies {
    service?: HrNotificationService;
}

export async function createHrNotification(
    dependencies: CreateHrNotificationDependencies,
    input: CreateHrNotificationInput,
): Promise<CreateHrNotificationResult> {
    const service = dependencies.service ?? getHrNotificationService();
    return service.createNotification(input);
}
