import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { ComplianceTier, OrganizationStatus } from '@/server/types/prisma';
import type { JsonRecord } from '@/server/types/json';

export interface PlatformTenantListItem {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
    complianceTier: ComplianceTier;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    regionCode: string;
    ownerEmail?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PlatformTenantListResult {
    items: PlatformTenantListItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface PlatformTenantSubscriptionSummary {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    status?: string | null;
    seatCount?: number | null;
    currentPeriodEnd?: string | null;
}

export interface PlatformTenantDetail extends PlatformTenantListItem {
    ownerName?: string | null;
    ownerPhone?: string | null;
    website?: string | null;
    subscription: PlatformTenantSubscriptionSummary | null;
    governanceTags?: JsonRecord | null;
    securityControls?: JsonRecord | null;
}

export type PlatformTenantStatusAction = 'SUSPEND' | 'RESTORE' | 'ARCHIVE';
