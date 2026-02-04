import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const WORKFLOW_TEMPLATE_TYPE_VALUES = ['ONBOARDING', 'OFFBOARDING'] as const;
export type WorkflowTemplateType = (typeof WORKFLOW_TEMPLATE_TYPE_VALUES)[number];

export const WORKFLOW_RUN_STATUS_VALUES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUS_VALUES)[number];

export interface OnboardingWorkflowTemplateRecord {
    id: string;
    orgId: string;
    name: string;
    description?: string | null;
    templateType: WorkflowTemplateType;
    version: number;
    isActive: boolean;
    definition: JsonValue;
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

export interface OnboardingWorkflowRunRecord {
    id: string;
    orgId: string;
    employeeId: string;
    templateId: string;
    offboardingId?: string | null;
    status: WorkflowRunStatus;
    currentStepKey?: string | null;
    startedAt: Date | string;
    completedAt?: Date | string | null;
    canceledAt?: Date | string | null;
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

export interface OnboardingWorkflowTemplateCreateInput {
    orgId: string;
    name: string;
    description?: string | null;
    templateType: WorkflowTemplateType;
    version?: number;
    isActive?: boolean;
    definition: JsonValue;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface OnboardingWorkflowTemplateUpdateInput {
    name?: string;
    description?: string | null;
    templateType?: WorkflowTemplateType;
    version?: number;
    isActive?: boolean;
    definition?: JsonValue;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}

export interface OnboardingWorkflowRunCreateInput {
    orgId: string;
    employeeId: string;
    templateId: string;
    offboardingId?: string | null;
    currentStepKey?: string | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface OnboardingWorkflowRunUpdateInput {
    status?: WorkflowRunStatus;
    currentStepKey?: string | null;
    completedAt?: Date | null;
    canceledAt?: Date | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}
