import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';
import { withOrgContext } from '@/server/security/guards';
import type { NotificationPreference, UserSession } from '@/server/types/hr-types';
import { listUserSessions } from '@/server/use-cases/auth/sessions/list-user-sessions';
import { getNotificationPreferencesAction } from '@/server/api-adapters/hr/notifications/get-notification-preferences';

export interface SecuritySessionSummary {
    sessionId: string;
    status: UserSession['status'];
    ipAddress: string | null;
    userAgent: string | null;
    startedAt: string;
    lastAccess: string;
    expiresAt: string;
    isCurrent: boolean;
}

export async function getSecuritySessionsForUi(
    authorization: RepositoryAuthorizationContext,
    currentSessionToken: string | undefined,
): Promise<SecuritySessionSummary[]> {
    const repository = createUserSessionRepository();
    const { sessions } = await listUserSessions({ userSessionRepository: repository }, { authorization });

    return sessions.map((session) => ({
        sessionId: session.id,
        status: session.status,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
        startedAt: session.startedAt.toISOString(),
        lastAccess: session.lastAccess.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        isCurrent: currentSessionToken ? session.sessionId === currentSessionToken : false,
    }));
}

export async function getSecurityNotificationPreferences(
    authorization: RepositoryAuthorizationContext,
): Promise<NotificationPreference[]> {
    return withOrgContext(
        {
            orgId: authorization.orgId,
            userId: authorization.userId,
            auditSource: authorization.auditSource,
            expectedClassification: authorization.dataClassification,
            expectedResidency: authorization.dataResidency,
            action: 'notification.preference.read',
            resourceType: 'notification.preference',
        },
        async () => {
            const { preferences } = await getNotificationPreferencesAction({ authorization });
            return preferences;
        },
    );
}
