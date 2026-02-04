import type { JsonRecord } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export interface OnboardingFeedbackRecord {
    id: string;
    orgId: string;
    employeeId: string;
    rating: number;
    summary?: string | null;
    comments?: string | null;
    submittedAt: Date | string;
    metadata?: JsonRecord | null;
    dataClassification?: DataClassificationLevel;
    residencyTag?: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface OnboardingFeedbackCreateInput {
    orgId: string;
    employeeId: string;
    rating: number;
    summary?: string | null;
    comments?: string | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}
