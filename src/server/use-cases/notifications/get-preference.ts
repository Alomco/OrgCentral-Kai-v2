import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { NotificationPreference } from '@/server/types/hr-types';
import { registerNotificationPreferenceCacheTag } from './cache-helpers';

export interface GetNotificationPreferencesInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface GetNotificationPreferencesResult {
    preferences: NotificationPreference[];
}

export interface GetNotificationPreferencesDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function getNotificationPreferences(
    dependencies: GetNotificationPreferencesDependencies,
    input: GetNotificationPreferencesInput,
): Promise<GetNotificationPreferencesResult> {
    const userId = input.userId ?? input.authorization.userId;

    const preferences = await dependencies.preferenceRepository.getNotificationPreferencesByUser(
        input.authorization.orgId,
        userId,
    );

    registerNotificationPreferenceCacheTag(input.authorization);

    return { preferences };
}
