import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import {
    invalidateNotificationPreferenceCacheTag,
    registerNotificationPreferenceCacheTag,
} from './cache-helpers';

export interface CreateNotificationPreferenceInput {
    authorization: RepositoryAuthorizationContext;
    preference: {
        userId: string;
        channel: NotificationPreference['channel'];
        enabled?: boolean;
        quietHours?: NotificationPreference['quietHours'];
        metadata?: NotificationPreference['metadata'];
    };
}

export interface CreateNotificationPreferenceResult {
    preference: NotificationPreference | null;
}

export interface CreateNotificationPreferenceDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function createNotificationPreference(
    dependencies: CreateNotificationPreferenceDependencies,
    input: CreateNotificationPreferenceInput,
): Promise<CreateNotificationPreferenceResult> {
    await dependencies.preferenceRepository.createNotificationPreference(input.authorization.orgId, {
        orgId: input.authorization.orgId,
        userId: input.preference.userId,
        channel: input.preference.channel,
        enabled: input.preference.enabled ?? true,
        quietHours: input.preference.quietHours ?? null,
        metadata: input.preference.metadata ?? null,
    });

    await invalidateNotificationPreferenceCacheTag(input.authorization);

    const preferences = await dependencies.preferenceRepository.getNotificationPreferencesByUser(
        input.authorization.orgId,
        input.preference.userId,
    );

    registerNotificationPreferenceCacheTag(input.authorization);

    const created = preferences.find((pref) => pref.channel === input.preference.channel) ?? null;

    return { preference: created };
}
