import { invalidateCache, registerCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_NOTIFICATION_PREFERENCES } from '@/server/repositories/cache-scopes';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const NOTIFICATION_CACHE_SCOPE = 'notifications';
export const NOTIFICATION_PREFERENCES_CACHE_SCOPE = CACHE_SCOPE_NOTIFICATION_PREFERENCES;

export interface NotificationCacheContext {
    orgId: string;
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

export function registerNotificationCache(context: NotificationCacheContext): void {
    registerCacheTag({
        orgId: context.orgId,
        classification: context.classification,
        residency: context.residency,
        scope: NOTIFICATION_CACHE_SCOPE,
    });
}

export async function invalidateNotificationCache(context: NotificationCacheContext): Promise<void> {
    await invalidateCache({
        orgId: context.orgId,
        classification: context.classification,
        residency: context.residency,
        scope: NOTIFICATION_CACHE_SCOPE,
    });
}

export function registerNotificationPreferenceCache(context: NotificationCacheContext): void {
    registerCacheTag({
        orgId: context.orgId,
        classification: context.classification,
        residency: context.residency,
        scope: NOTIFICATION_PREFERENCES_CACHE_SCOPE,
    });
}

export async function invalidateNotificationPreferenceCache(context: NotificationCacheContext): Promise<void> {
    await invalidateCache({
        orgId: context.orgId,
        classification: context.classification,
        residency: context.residency,
        scope: NOTIFICATION_PREFERENCES_CACHE_SCOPE,
    });
}
