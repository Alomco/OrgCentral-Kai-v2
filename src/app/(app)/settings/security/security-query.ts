import { securityOverviewSchema, type SecurityOverviewResponse } from '@/lib/schemas/security-overview';

export const SECURITY_OVERVIEW_QUERY_KEY = ['settings', 'security', 'overview'] as const;

export async function fetchSecurityOverview(): Promise<SecurityOverviewResponse> {
    const response = await fetch('/api/settings/security/overview', {
        method: 'GET',
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error('Unable to load security overview.');
    }

    const json = (await response.json()) as SecurityOverviewResponse;
    return securityOverviewSchema.parse(json);
}
