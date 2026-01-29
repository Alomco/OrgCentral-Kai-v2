import type { HrIntegrationsDefaults } from './integrations-schema';
import { getHrIntegrationsDefaultsAction } from './integrations-read-action';

export const HR_INTEGRATIONS_QUERY_KEY = ['hr', 'settings', 'integrations'] as const;

export async function fetchHrIntegrationsDefaults(): Promise<HrIntegrationsDefaults | null> {
    return getHrIntegrationsDefaultsAction();
}
