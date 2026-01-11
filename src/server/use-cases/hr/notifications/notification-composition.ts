import { PrismaHRNotificationRepository } from '@/server/repositories/prisma/hr/notifications';
import type { IHRNotificationRepository } from '@/server/repositories/contracts/hr/notifications/hr-notification-repository-contract';
import { HrNotificationService, type HrNotificationServiceDependencies } from '@/server/services/hr/notifications/hr-notification-service';

export interface HrNotificationCompositionOverrides {
    repository?: IHRNotificationRepository;
}

function buildDependencies(overrides?: HrNotificationCompositionOverrides): HrNotificationServiceDependencies {
    return {
        hrNotificationRepository: overrides?.repository ?? new PrismaHRNotificationRepository(),
    };
}

export function getHrNotificationService(overrides?: HrNotificationCompositionOverrides): HrNotificationService {
    return new HrNotificationService(buildDependencies(overrides));
}