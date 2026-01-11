import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { NotificationPreference } from '@/server/types/hr-types';
import { getNotificationPreferencesWithPrisma } from '@/server/use-cases/notifications/notification-preference-composition';

export interface GetNotificationPreferencesActionInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface GetNotificationPreferencesActionResult {
    preferences: NotificationPreference[];
}

// API adapter: list notification preferences for a user.
export async function getNotificationPreferencesAction(
    input: GetNotificationPreferencesActionInput,
): Promise<GetNotificationPreferencesActionResult> {
    const result = await getNotificationPreferencesWithPrisma({
        authorization: input.authorization,
        userId: input.userId ?? input.authorization.userId,
    });

    return result;
}
