import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    type NotificationCacheContext,
    registerNotificationPreferenceCache,
    invalidateNotificationPreferenceCache,
} from '@/server/repositories/notifications/notification-cache';

function toCacheContext(authorization: RepositoryAuthorizationContext): NotificationCacheContext {
    return {
        orgId: authorization.orgId,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    };
}

export function registerNotificationPreferenceCacheTag(
    authorization: RepositoryAuthorizationContext,
): void {
    registerNotificationPreferenceCache(toCacheContext(authorization));
}

export async function invalidateNotificationPreferenceCacheTag(
    authorization: RepositoryAuthorizationContext,
): Promise<void> {
    await invalidateNotificationPreferenceCache(toCacheContext(authorization));
}
