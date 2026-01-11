import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { getHrNotificationService } from '@/server/use-cases/hr/notifications/notification-composition';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { HRNotificationDTO, HRNotificationListFilters } from '@/server/types/hr/notifications';

export interface GetHrNotificationsForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    filters?: HRNotificationListFilters;
}

export interface GetHrNotificationsForUiResult {
    notifications: HRNotificationDTO[];
    unreadCount: number;
}

export async function getHrNotificationsForUi(
    input: GetHrNotificationsForUiInput,
): Promise<GetHrNotificationsForUiResult> {
    async function getNotificationsCached(
        cachedInput: GetHrNotificationsForUiInput,
    ): Promise<GetHrNotificationsForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        const service = getHrNotificationService();
        const result = await service.listNotifications({
            authorization: cachedInput.authorization,
            userId: cachedInput.userId,
            filters: cachedInput.filters,
        });

        return { notifications: result.notifications, unreadCount: result.unreadCount };
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getHrNotificationService();
        const result = await service.listNotifications({
            authorization: input.authorization,
            userId: input.userId,
            filters: input.filters,
        });

        return { notifications: result.notifications, unreadCount: result.unreadCount };
    }

    return getNotificationsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
