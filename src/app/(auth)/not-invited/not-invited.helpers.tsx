import { headers } from 'next/headers';
import { z } from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES, type DataClassificationLevel, type DataResidencyZone } from '@/server/types/tenant';

export interface TenantContext {
    orgId: string;
    residency: DataResidencyZone;
    classification: DataClassificationLevel;
}

export function NotInvitedFallback() {
    return (
        <AuthLayout title="Loading tenant styling" subtitle="Preparing your workspace...">
            <div className="h-64 w-full animate-pulse rounded-3xl bg-[hsl(var(--muted))] opacity-70" />
        </AuthLayout>
    );
}

export function IllustrationFallback() {
    return (
        <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl bg-[hsl(var(--card))] shadow-inner">
            <div className="h-24 w-24 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        </div>
    );
}

export async function resolveTenantContext(): Promise<TenantContext> {
    const headerList = await headers();
    const orgId = headerList.get('x-org-id') ?? 'public';
    const residencyRaw = headerList.get('x-data-residency');
    const classificationRaw = headerList.get('x-data-classification');

    const residency = z.enum(DATA_RESIDENCY_ZONES).catch('UK_ONLY').parse(residencyRaw ?? 'UK_ONLY');
    const classification = z.enum(DATA_CLASSIFICATION_LEVELS).catch('OFFICIAL').parse(classificationRaw ?? 'OFFICIAL');

    return { orgId, residency, classification };
}

export function isSafeNext(candidate?: string): boolean {
    if (!candidate) {
        return true;
    }

    return candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('://');
}
