import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { withOrgContext } from '@/server/security/guards';
import { getNotificationPreferences } from '@/server/use-cases/notifications/get-preference';
import { listUserSessions } from '@/server/use-cases/auth/sessions/list-user-sessions';
import type { SecurityOverviewResponse, JsonValue } from '@/lib/schemas/security-overview';

export interface SecurityOverviewDependencies {
    preferenceRepository: INotificationPreferenceRepository;
    userSessionRepository: Pick<IUserSessionRepository, 'getUserSessionsByUser'>;
}

export interface SecurityOverviewInput {
    authorization: RepositoryAuthorizationContext;
    currentSessionToken?: string;
}

export async function getSecurityOverview(
    dependencies: SecurityOverviewDependencies,
    input: SecurityOverviewInput,
): Promise<SecurityOverviewResponse> {
    const { sessions } = await listUserSessions(
        { userSessionRepository: dependencies.userSessionRepository },
        { authorization: input.authorization },
    );

    const notificationPreferences = await withOrgContext(
        {
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            auditSource: input.authorization.auditSource,
            expectedClassification: input.authorization.dataClassification,
            expectedResidency: input.authorization.dataResidency,
            action: 'notification.preference.read',
            resourceType: 'notification.preference',
        },
        async () => {
            const { preferences } = await getNotificationPreferences(
                { preferenceRepository: dependencies.preferenceRepository },
                { authorization: input.authorization },
            );
            return preferences;
        },
    );

    const sessionSummaries = sessions.map((session) => ({
        sessionToken: session.sessionId,
        status: session.status,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
        startedAt: session.startedAt.toISOString(),
        lastAccess: session.lastAccess.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        isCurrent: input.currentSessionToken
            ? session.sessionId === input.currentSessionToken
            : false,
    }));

    return {
        sessions: sessionSummaries,
        notificationPreferences: notificationPreferences.map((preference) => ({
            id: preference.id,
            orgId: preference.orgId,
            userId: preference.userId,
            channel: preference.channel,
            enabled: preference.enabled,
            quietHours: preference.quietHours as JsonValue | undefined,
            metadata: preference.metadata as JsonValue | undefined,
            updatedAt: preference.updatedAt.toISOString(),
        })),
    };
}
