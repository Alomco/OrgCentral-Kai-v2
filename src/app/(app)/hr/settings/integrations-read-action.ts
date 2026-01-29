'use server';

import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getHrSettingsForUi } from '@/server/use-cases/hr/settings/get-hr-settings.cached';

import { deriveHrIntegrationsFormDefaults, type HrIntegrationsDefaults } from './integrations-schema';

export async function getHrIntegrationsDefaultsAction(): Promise<HrIntegrationsDefaults | null> {
    try {
        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:settings:integrations:read',
            },
        );

        const { settings } = await getHrSettingsForUi({
            authorization,
            orgId: authorization.orgId,
        });

        return deriveHrIntegrationsFormDefaults(settings);
    } catch {
        return null;
    }
}
