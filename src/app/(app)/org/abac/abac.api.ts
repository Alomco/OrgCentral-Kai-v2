export const abacKeys = {
    policies: (orgId: string) => ['org', orgId, 'abac', 'policies'] as const,
} as const;

export async function updateAbacPolicies(orgId: string, policiesText: string): Promise<void> {
    const res = await fetch(`/api/org/${orgId}/abac`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policiesText }),
    });
    if (!res.ok) {
        throw new Error('Unable to update policies');
    }
}
