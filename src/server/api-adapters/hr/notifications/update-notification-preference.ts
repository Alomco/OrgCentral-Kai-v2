import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import { updateNotificationPreference } from '@/server/use-cases/notifications/update-preference';
import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';

export interface UpdateNotificationPreferenceActionInput {
    authorization: RepositoryAuthorizationContext;
    preferenceId: string;
    updates: Partial<Pick<NotificationPreference, 'channel' | 'enabled' | 'quietHours' | 'metadata'>>;
}

export interface UpdateNotificationPreferenceActionResult {
    preference: NotificationPreference | null;
}

// API adapter: update a notification preference.
export async function updateNotificationPreferenceAction(
    input: UpdateNotificationPreferenceActionInput,
): Promise<UpdateNotificationPreferenceActionResult> {
    const repository = new PrismaNotificationPreferenceRepository();
    const result = await updateNotificationPreference(
        { preferenceRepository: repository },
        { 
            authorization: input.authorization,
            preferenceId: input.preferenceId,
            updates: input.updates,
        }
    );

    return result;
}
