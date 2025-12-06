import { EntityNotFoundError } from '@/server/errors';
import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NotificationPreference } from '@/server/types/hr-types';
import { registerNotificationPreferenceCacheTag } from './cache-helpers';

export interface GetNotificationPreferenceByIdInput {
    authorization: RepositoryAuthorizationContext;
    preferenceId: string;
}

export interface GetNotificationPreferenceByIdResult {
    preference: NotificationPreference;
}

export interface GetNotificationPreferenceByIdDependencies {
    preferenceRepository: INotificationPreferenceRepository;
}

export async function getNotificationPreferenceById(
    dependencies: GetNotificationPreferenceByIdDependencies,
    input: GetNotificationPreferenceByIdInput,
): Promise<GetNotificationPreferenceByIdResult> {
    const preference = await dependencies.preferenceRepository.getNotificationPreference(
        input.authorization.orgId,
        input.preferenceId,
    );

    if (!preference) {
        throw new EntityNotFoundError('Notification preference', {
            preferenceId: input.preferenceId,
            orgId: input.authorization.orgId,
        });
    }

    registerNotificationPreferenceCacheTag(input.authorization);

    return { preference };
}
