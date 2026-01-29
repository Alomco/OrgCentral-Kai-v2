import type { DebugSecurityResponse } from './DevelopmentSecurityWidget.types';

export const devSecurityKeys = {
    detail: () => ['dev', 'security'] as const,
} as const;

export async function fetchDevSecurity(): Promise<DebugSecurityResponse | null> {
    const response = await fetch('/api/debug/security', { cache: 'no-store' });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error('Failed to load security context');
    }

    if (body && typeof body === 'object') {
        return body as DebugSecurityResponse;
    }

    return null;
}
