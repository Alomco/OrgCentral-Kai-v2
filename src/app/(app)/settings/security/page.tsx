import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { SecuritySettingsClient } from './_components/security-settings-client';
import { getSecurityOverview } from '@/server/use-cases/settings/security/get-security-overview';
import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';
import { buildNotificationPreferenceServiceDependencies } from '@/server/repositories/providers/org/notification-preference-service-dependencies';

export const metadata: Metadata = {
    title: 'Security & Account • OrgCentral',
    description: 'Manage authentication, sessions, recovery, and security notifications for your account.',
};

export default async function SecuritySettingsPage() {
    const headerStore = await nextHeaders();
    const { session, authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:settings:security:read',
        },
    );

    const deps = buildNotificationPreferenceServiceDependencies();
    const overview = await getSecurityOverview(
        {
            preferenceRepository: deps.preferenceRepository,
            userSessionRepository: createUserSessionRepository(),
        },
        {
            authorization,
            currentSessionToken: session.session.token,
        },
    );

    const isMfaEnabled = Boolean(session.user.twoFactorEnabled);

    return (
        <div className="space-y-6 p-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
                <h1 className="text-2xl font-semibold text-foreground">Security & account</h1>
                <p className="text-sm text-muted-foreground">
                    Review sign-in protection, sessions, recovery, and notification controls for your account.
                </p>
            </header>

            <SecuritySettingsClient initialData={overview} isMfaEnabled={isMfaEnabled} />
        </div>
    );
}
