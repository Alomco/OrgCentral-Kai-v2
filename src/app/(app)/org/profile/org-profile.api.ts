export const orgProfileKeys = {
    detail: (orgId: string) => ['org', orgId, 'profile'] as const,
} as const;

export interface OrganizationContactPayload {
    name: string;
    email: string;
    phone: string;
}

export interface OrganizationProfileUpdatePayload {
    name: string;
    website: string;
    phone: string;
    industry: string;
    companyType: string;
    employeeCountRange: string;
    incorporationDate: string;
    address: string;
    registeredOfficeAddress: string;
    primaryBusinessContact: OrganizationContactPayload;
    accountsFinanceContact: OrganizationContactPayload;
}

export async function updateOrganizationProfile(
    orgId: string,
    payload: OrganizationProfileUpdatePayload,
): Promise<void> {
    const res = await fetch(`/api/org/${orgId}/organization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorBody: unknown = await res.json().catch(() => null);
        const message = readErrorMessage(errorBody) ?? 'Unable to update organization';
        throw new Error(message);
    }
}

function readErrorMessage(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const candidate = value as { message?: unknown };
    return typeof candidate.message === 'string' ? candidate.message : null;
}
