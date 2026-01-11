import { getHrNotificationService as buildNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import type { HrNotificationService } from './hr-notification-service';

let sharedNotificationService: HrNotificationService | null = null;

export function getHrNotificationService(): HrNotificationService {
    sharedNotificationService ??= buildNotificationService();
    return sharedNotificationService;
}

export type HrNotificationServiceContract = HrNotificationService;
