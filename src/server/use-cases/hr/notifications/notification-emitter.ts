import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationCreateDTO, HRNotificationDTO } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from '@/server/services/hr/notifications/hr-notification-service';

export interface EmitHrNotificationInput {
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

export interface EmitHrNotificationDependencies {
    service?: HrNotificationService;
}

/**
 * Shared emitter wrapper to publish HR notifications via the service layer.
 * Centralizes defaulting of classification/residency/audit fields.
 */
export async function emitHrNotification(
    deps: EmitHrNotificationDependencies,
    input: EmitHrNotificationInput,
): Promise<HRNotificationDTO> {
    const service = deps.service ?? getHrNotificationService();
    const result = await service.createNotification(input);
    return result.notification;
}
