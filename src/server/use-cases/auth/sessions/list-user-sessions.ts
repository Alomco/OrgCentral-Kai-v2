import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { withOrgContext } from '@/server/security/guards';
import type { UserSession } from '@/server/types/hr-types';

export interface ListUserSessionsInput {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

export interface ListUserSessionsResult {
    sessions: UserSession[];
}

export interface ListUserSessionsDependencies {
    userSessionRepository: Pick<IUserSessionRepository, 'getUserSessionsByUser'>;
}

export async function listUserSessions(
    dependencies: ListUserSessionsDependencies,
    input: ListUserSessionsInput,
): Promise<ListUserSessionsResult> {
    const userId = input.userId ?? input.authorization.userId;

    const sessions = await withOrgContext(
        {
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            auditSource: input.authorization.auditSource,
            expectedClassification: input.authorization.dataClassification,
            expectedResidency: input.authorization.dataResidency,
            action: 'auth.session.list',
            resourceType: 'auth.session',
            resourceAttributes: { userId },
        },
        async () =>
            dependencies.userSessionRepository.getUserSessionsByUser(
                input.authorization.orgId,
                userId,
            ),
    );

    return { sessions };
}
