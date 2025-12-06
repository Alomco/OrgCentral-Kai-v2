import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateNotificationPreferenceCacheTag } from './cache-helpers';

export interface EnsureDefaultNotificationPreferencesInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
}

export interface EnsureDefaultNotificationPreferencesResult {
    success: true;
}

export interface EnsureDefaultNotificationPreferencesDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function ensureDefaultNotificationPreferences(
    dependencies: EnsureDefaultNotificationPreferencesDependencies,
    input: EnsureDefaultNotificationPreferencesInput,
): Promise<EnsureDefaultNotificationPreferencesResult> {
    await dependencies.preferenceRepository.setDefaultNotificationPreferences(
        input.authorization.orgId,
        input.userId,
    );

    await invalidateNotificationPreferenceCacheTag(input.authorization);

    return { success: true };
}
