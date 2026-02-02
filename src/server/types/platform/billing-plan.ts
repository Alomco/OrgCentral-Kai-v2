import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { JsonRecord } from '@/server/types/json';

export const BILLING_PLAN_CADENCES = ['monthly', 'annual'] as const;
export type BillingPlanCadence = (typeof BILLING_PLAN_CADENCES)[number];

export const BILLING_PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const;
export type BillingPlanStatus = (typeof BILLING_PLAN_STATUSES)[number];

export interface BillingPlan {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    name: string;
    description?: string | null;
    stripePriceId: string;
    currency: string;
    amountCents: number;
    cadence: BillingPlanCadence;
    features: string[];
    limits: JsonRecord;
    status: BillingPlanStatus;
    effectiveFrom: string;
    effectiveTo?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BillingPlanAssignment {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    tenantId: string;
    planId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    status: 'PENDING' | 'ACTIVE' | 'RETIRED';
    createdAt: string;
    updatedAt: string;
}
