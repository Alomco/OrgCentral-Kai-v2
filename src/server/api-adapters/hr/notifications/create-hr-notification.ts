import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationCreateDTO, HRNotificationDTO } from '@/server/types/hr/notifications';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import { invalidateHrNotifications } from '@/server/lib/cache-tags/hr-notifications';

export interface CreateHrNotificationActionInput {
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

export interface CreateHrNotificationActionResult {
    notification: HRNotificationDTO;
}

// API adapter: create an HR notification via HrNotificationService and revalidate cache tag.
export async function createHrNotificationAction(
    input: CreateHrNotificationActionInput,
): Promise<CreateHrNotificationActionResult> {
    const service = getHrNotificationService();
    const result = await service.createNotification(input);

    await invalidateHrNotifications({
        orgId: input.authorization.orgId,
        classification: input.authorization.dataClassification,
        residency: input.authorization.dataResidency,
    });

    return result;
}
