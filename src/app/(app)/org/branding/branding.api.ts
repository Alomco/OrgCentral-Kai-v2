import type { OrgBranding } from '@/server/types/branding-types';

export const brandingKeys = {
    detail: (orgId: string) => ['org', orgId, 'branding'] as const,
} as const;

export interface OrgBrandingUpdatePayload {
    companyName: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    customCss: string;
}

function isOrgBranding(value: unknown): value is OrgBranding | null {
    if (value === null) {
        return true;
    }
    return Boolean(value) && typeof value === 'object';
}

export async function getOrgBranding(orgId: string): Promise<OrgBranding | null> {
    const res = await fetch(`/api/org/${orgId}/branding`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Unable to load branding');
    }
    const data: unknown = await res.json();
    if (!isOrgBranding(data)) {
        throw new Error('Invalid branding response');
    }
    return data;
}

export async function updateOrgBranding(orgId: string, payload: OrgBrandingUpdatePayload): Promise<void> {
    const res = await fetch(`/api/org/${orgId}/branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error('Unable to save');
    }
}

export async function resetOrgBranding(orgId: string): Promise<void> {
    const res = await fetch(`/api/org/${orgId}/branding`, { method: 'DELETE' });
    if (!res.ok) {
        throw new Error('Unable to reset');
    }
}
