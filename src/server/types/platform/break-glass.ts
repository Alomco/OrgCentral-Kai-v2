import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const BREAK_GLASS_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONSUMED'] as const;
export type BreakGlassStatus = (typeof BREAK_GLASS_STATUSES)[number];

export const BREAK_GLASS_SCOPES = ['tenant-status', 'platform-tools', 'impersonation'] as const;
export type BreakGlassScope = (typeof BREAK_GLASS_SCOPES)[number];

export interface BreakGlassApproval {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    requestedBy: string;
    approvedBy?: string | null;
    reason: string;
    scope: BreakGlassScope;
    status: BreakGlassStatus;
    targetOrgId: string | null;
    action: string | null;
    resourceId: string | null;
    createdAt: string;
    approvedAt?: string | null;
    expiresAt: string;
    consumedAt?: string | null;
    consumedBy?: string | null;
}
