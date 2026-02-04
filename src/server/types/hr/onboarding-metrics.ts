import type { JsonRecord } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const ONBOARDING_METRIC_SOURCE_VALUES = ['SYSTEM', 'SURVEY', 'MANUAL'] as const;
export type OnboardingMetricSource = (typeof ONBOARDING_METRIC_SOURCE_VALUES)[number];

export interface OnboardingMetricDefinitionRecord {
    id: string;
    orgId: string;
    key: string;
    label: string;
    unit?: string | null;
    targetValue?: number | string | null;
    thresholds?: JsonRecord | null;
    isActive: boolean;
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

export interface OnboardingMetricResultRecord {
    id: string;
    orgId: string;
    employeeId: string;
    metricId: string;
    value?: number | string | null;
    valueText?: string | null;
    source: OnboardingMetricSource;
    measuredAt: Date | string;
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

export interface OnboardingMetricDefinitionCreateInput {
    orgId: string;
    key: string;
    label: string;
    unit?: string | null;
    targetValue?: number | null;
    thresholds?: JsonRecord | null;
    isActive?: boolean;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface OnboardingMetricDefinitionUpdateInput {
    label?: string;
    unit?: string | null;
    targetValue?: number | null;
    thresholds?: JsonRecord | null;
    isActive?: boolean;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}

export interface OnboardingMetricResultCreateInput {
    orgId: string;
    employeeId: string;
    metricId: string;
    value?: number | null;
    valueText?: string | null;
    source?: OnboardingMetricSource;
    measuredAt?: Date | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}
