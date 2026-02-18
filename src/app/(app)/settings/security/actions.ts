'use server';

import { headers as nextHeaders } from 'next/headers';
import { z } from 'zod';

import { toActionState, type ActionState } from '@/server/actions/action-state';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { performSessionRevocation } from '@/server/use-cases/auth/sessions/revoke-session-action';
import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';
import { getNotificationPreferencesAction } from '@/server/api-adapters/hr/notifications/get-notification-preferences';
import { updateNotificationPreferenceAction } from '@/server/api-adapters/hr/notifications/update-notification-preference';
import { withOrgContext } from '@/server/security/guards';
import { appLogger } from '@/server/logging/structured-logger';
import { SECURITY_NOTIFICATION_TYPE_VALUES } from './security-notification-types';
import {
    extractSecurityNotificationState,
    mergeSecurityNotificationMetadata,
    type JsonValue,
} from './security-notification-helpers';

const revokeSessionSchema = z.object({
    sessionId: z.string().min(1),
});

const updateSecurityNotificationsSchema = z.object({
    preferenceId: z.string().min(1),
    enabled: z.boolean().optional(),
    disabledTypes: z.array(z.enum(SECURITY_NOTIFICATION_TYPE_VALUES)).optional(),
});

const AUDIT_SOURCES = {
    revokeSession: 'action:settings:security:revoke-session',
    revokeOthers: 'action:settings:security:revoke-others',
    notifications: 'action:settings:security:notifications',
} as const;

const ACTIONS = {
    revoke: 'auth.session.revoke',
    list: 'auth.session.list',
    notificationUpdate: 'notification.preference.update',
} as const;

const RESOURCE_TYPES = {
    session: 'auth.session',
    notificationPreference: 'notification.preference',
} as const;

export async function revokeSessionAction(
    input: z.infer<typeof revokeSessionSchema>,
): Promise<ActionState<{ revoked: true }>> {
    const parsed = revokeSessionSchema.parse(input);

    return toActionState(async () => {
        const headerStore = await nextHeaders();
        const { session, authorization } = await getSessionContext({}, {
            headers: headerStore,
            auditSource: AUDIT_SOURCES.revokeSession,
        });
        const repository = createUserSessionRepository();
        let targetSessionToken = '';
        let isCurrentSession = false;

        await withOrgContext(
            {
                orgId: authorization.orgId,
                userId: authorization.userId,
                auditSource: AUDIT_SOURCES.revokeSession,
                expectedClassification: authorization.dataClassification,
                expectedResidency: authorization.dataResidency,
                action: ACTIONS.revoke,
                resourceType: RESOURCE_TYPES.session,
            },
            async () => {
                const sessions = await repository.getUserSessionsByUser(
                    authorization.orgId,
                    authorization.userId,
                );
                const targetSession = sessions.find((sessionItem) => sessionItem.id === parsed.sessionId);
                if (!targetSession) {
                    throw new Error('Session not found.');
                }
                targetSessionToken = targetSession.sessionId;
                isCurrentSession = targetSessionToken === session.session.token;

                await performSessionRevocation({
                    headers: headerStore,
                    sessionToken: targetSessionToken,
                    orgId: authorization.orgId,
                    expectedClassification: authorization.dataClassification,
                    expectedResidency: authorization.dataResidency,
                    auditSource: AUDIT_SOURCES.revokeSession,
                    action: ACTIONS.revoke,
                    resourceType: RESOURCE_TYPES.session,
                });
            },
        );

        appLogger.info('User session revoked from security settings.', {
            orgId: authorization.orgId,
            action: ACTIONS.revoke,
            isCurrentSession,
        });

        return { revoked: true };
    });
}

export async function revokeOtherSessionsAction(): Promise<ActionState<{ revokedCount: number }>> {
    return toActionState(async () => {
        const headerStore = await nextHeaders();
        const { session, authorization } = await getSessionContext({}, {
            headers: headerStore,
            auditSource: AUDIT_SOURCES.revokeOthers,
        });

        const currentToken = session.session.token;
        const repository = createUserSessionRepository();

        const sessions = await withOrgContext(
            {
                orgId: authorization.orgId,
                userId: authorization.userId,
                auditSource: AUDIT_SOURCES.revokeOthers,
                expectedClassification: authorization.dataClassification,
                expectedResidency: authorization.dataResidency,
                action: ACTIONS.list,
                resourceType: RESOURCE_TYPES.session,
            },
            async () =>
                repository.getUserSessionsByUser(authorization.orgId, authorization.userId),
        );

        const tokensToRevoke = sessions
            .map((sessionItem) => sessionItem.sessionId)
            .filter((token) => token && token !== currentToken);

        let revokedCount = 0;
        for (const token of tokensToRevoke) {
            await performSessionRevocation({
                headers: headerStore,
                sessionToken: token,
                orgId: authorization.orgId,
                expectedClassification: authorization.dataClassification,
                expectedResidency: authorization.dataResidency,
                auditSource: AUDIT_SOURCES.revokeOthers,
                action: ACTIONS.revoke,
                resourceType: RESOURCE_TYPES.session,
            });
            revokedCount += 1;
        }

        appLogger.info('User sessions revoked from security settings.', {
            orgId: authorization.orgId,
            action: ACTIONS.revoke,
            revokedCount,
        });

        return { revokedCount };
    });
}

export async function updateSecurityNotificationPreference(
    input: z.infer<typeof updateSecurityNotificationsSchema>,
): Promise<ActionState<{ preferenceId: string }>> {
    const parsed = updateSecurityNotificationsSchema.parse(input);

    return toActionState(async () => {
        const headerStore = await nextHeaders();
        const { authorization } = await getSessionContext({}, {
            headers: headerStore,
            auditSource: AUDIT_SOURCES.notifications,
        });

        await withOrgContext(
            {
                orgId: authorization.orgId,
                userId: authorization.userId,
                auditSource: AUDIT_SOURCES.notifications,
                expectedClassification: authorization.dataClassification,
                expectedResidency: authorization.dataResidency,
                action: ACTIONS.notificationUpdate,
                resourceType: RESOURCE_TYPES.notificationPreference,
                resourceAttributes: { preferenceId: parsed.preferenceId },
            },
            async () => {
                const { preferences } = await getNotificationPreferencesAction({ authorization });
                const preference = preferences.find((item) => item.id === parsed.preferenceId);
                if (!preference) {
                    throw new Error('Notification preference not found.');
                }

                const currentState = extractSecurityNotificationState(
                    preference.metadata as JsonValue | undefined,
                );
                const nextDisabledTypes = parsed.disabledTypes ?? currentState.disabledTypes;
                const nextMetadata = mergeSecurityNotificationMetadata(
                    preference.metadata as JsonValue | undefined,
                    nextDisabledTypes,
                );

                await updateNotificationPreferenceAction({
                    authorization,
                    preferenceId: parsed.preferenceId,
                    updates: {
                        enabled: parsed.enabled,
                        metadata: nextMetadata,
                    },
                });
            },
        );

        appLogger.info('Security notification preferences updated.', {
            orgId: authorization.orgId,
            action: ACTIONS.notificationUpdate,
        });

        return { preferenceId: parsed.preferenceId };
    });
}
