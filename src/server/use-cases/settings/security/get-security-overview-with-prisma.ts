import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';
import { buildNotificationPreferenceServiceDependencies } from '@/server/repositories/providers/org/notification-preference-service-dependencies';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { SecurityOverviewResponse } from '@/lib/schemas/security-overview';
import { getSecurityOverview } from './get-security-overview';

export interface GetSecurityOverviewWithPrismaInput {
    authorization: RepositoryAuthorizationContext;
    currentSessionToken: string;
}

export async function getSecurityOverviewWithPrisma(
    input: GetSecurityOverviewWithPrismaInput,
): Promise<SecurityOverviewResponse> {
    const deps = buildNotificationPreferenceServiceDependencies();

    return getSecurityOverview(
        {
            preferenceRepository: deps.preferenceRepository,
            userSessionRepository: createUserSessionRepository(),
        },
        {
            authorization: input.authorization,
            currentSessionToken: input.currentSessionToken,
        },
    );
}
