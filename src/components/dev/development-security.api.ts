import type { DebugSecurityResponse } from './DevelopmentSecurityWidget.types';

export const devSecurityKeys = {
    current: () => ['dev', 'security'] as const,
} as const;

export async function fetchDevelopmentSecurity(): Promise<DebugSecurityResponse | null> {
    const response = await fetch('/api/debug/security', { cache: 'no-store' });
    const body: unknown = await response.json().catch(() => null);

    if (body && typeof body === 'object') {
        return body as DebugSecurityResponse;
    }

    return null;
}
