import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const IMPERSONATION_STATUSES = ['PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED'] as const;
export type ImpersonationStatus = (typeof IMPERSONATION_STATUSES)[number];

export interface ImpersonationRequest {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    requestedBy: string;
    targetUserId: string;
    targetOrgId: string;
    reason: string;
    status: ImpersonationStatus;
    approvedBy?: string | null;
    approvedAt?: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface ImpersonationSession {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    requestId: string;
    startedBy: string;
    targetUserId: string;
    targetOrgId: string;
    status: ImpersonationStatus;
    sessionToken: string;
    startedAt: string;
    expiresAt: string;
    revokedAt?: string | null;
}
