import { queryOptions } from '@tanstack/react-query';
import type { ComplianceCategory } from '@/server/types/compliance-types';

export const complianceCategoryKeys = {
    list: () => ['hr', 'compliance', 'categories'] as const,
} as const;

export interface ComplianceCategoryListResponse {
    categories: ComplianceCategory[];
}

export interface ComplianceCategorySavePayload {
    key: string;
    label: string;
    sortOrder: number;
}

export async function fetchComplianceCategories(): Promise<ComplianceCategoryListResponse> {
    const response = await fetch('/api/hr/compliance/categories', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Unable to load categories.');
    }
    const payload = (await response.json()) as { success: boolean; categories?: ComplianceCategory[] };
    return { categories: payload.categories ?? [] };
}

export async function saveComplianceCategory(payload: ComplianceCategorySavePayload): Promise<ComplianceCategory> {
    const response = await fetch('/api/hr/compliance/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? 'Unable to save category.');
    }

    const result = (await response.json()) as { category?: ComplianceCategory };
    if (!result.category) {
        throw new Error('Unable to save category.');
    }

    return result.category;
}

export function listComplianceCategoriesQuery() {
    return queryOptions({
        queryKey: complianceCategoryKeys.list(),
        queryFn: fetchComplianceCategories,
        staleTime: 60_000,
    });
}

