import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateNotificationPreferenceCacheTag } from './cache-helpers';

export interface DeleteNotificationPreferenceInput {
    authorization: RepositoryAuthorizationContext;
    preferenceId: string;
}

export interface DeleteNotificationPreferenceResult {
    success: true;
}

export interface DeleteNotificationPreferenceDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function deleteNotificationPreference(
    dependencies: DeleteNotificationPreferenceDependencies,
    input: DeleteNotificationPreferenceInput,
): Promise<DeleteNotificationPreferenceResult> {
    await dependencies.preferenceRepository.deleteNotificationPreference(
        input.authorization.orgId,
        input.preferenceId,
    );

    await invalidateNotificationPreferenceCacheTag(input.authorization);

    return { success: true };
}
