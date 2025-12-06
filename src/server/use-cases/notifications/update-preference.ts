import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import {
    invalidateNotificationPreferenceCacheTag,
    registerNotificationPreferenceCacheTag,
} from './cache-helpers';

export interface UpdateNotificationPreferenceInput {
    authorization: RepositoryAuthorizationContext;
    preferenceId: string;
    updates: Partial<Pick<NotificationPreference, 'channel' | 'enabled' | 'quietHours' | 'metadata'>>;
}

export interface UpdateNotificationPreferenceResult {
    preference: NotificationPreference | null;
}

export interface UpdateNotificationPreferenceDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function updateNotificationPreference(
    dependencies: UpdateNotificationPreferenceDependencies,
    input: UpdateNotificationPreferenceInput,
): Promise<UpdateNotificationPreferenceResult> {
    await dependencies.preferenceRepository.updateNotificationPreference(
        input.authorization.orgId,
        input.preferenceId,
        input.updates,
    );

    await invalidateNotificationPreferenceCacheTag(input.authorization);

    const preference = await dependencies.preferenceRepository.getNotificationPreference(
        input.authorization.orgId,
        input.preferenceId,
    );

    registerNotificationPreferenceCacheTag(input.authorization);

    return { preference };
}
