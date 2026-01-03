import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import { getNotificationPreferences } from '@/server/use-cases/notifications/get-preference';
import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';

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
    const repository = new PrismaNotificationPreferenceRepository();
    const result = await getNotificationPreferences(
        { preferenceRepository: repository },
        { 
            authorization: input.authorization,
            userId: input.userId ?? input.authorization.userId,
        }
    );

    return result;
}
