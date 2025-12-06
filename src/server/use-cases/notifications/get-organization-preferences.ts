import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import { registerNotificationPreferenceCacheTag } from './cache-helpers';

export interface GetOrganizationNotificationPreferencesInput {
    authorization: RepositoryAuthorizationContext;
    filters?: {
        userId?: string;
        channel?: NotificationPreference['channel'];
        enabled?: boolean;
    };
}

export interface GetOrganizationNotificationPreferencesResult {
    preferences: NotificationPreference[];
}

export interface GetOrganizationNotificationPreferencesDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function getOrganizationNotificationPreferences(
    dependencies: GetOrganizationNotificationPreferencesDependencies,
    input: GetOrganizationNotificationPreferencesInput,
): Promise<GetOrganizationNotificationPreferencesResult> {
    const preferences = await dependencies.preferenceRepository.getNotificationPreferencesByOrganization(
        input.authorization.orgId,
        input.filters,
    );

    registerNotificationPreferenceCacheTag(input.authorization);

    return { preferences };
}
