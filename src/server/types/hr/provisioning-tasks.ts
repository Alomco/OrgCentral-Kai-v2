import type { JsonRecord } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const PROVISIONING_TASK_TYPE_VALUES = ['ACCOUNT', 'EQUIPMENT', 'ACCESS', 'LICENSE', 'SOFTWARE'] as const;
export type ProvisioningTaskType = (typeof PROVISIONING_TASK_TYPE_VALUES)[number];

export const PROVISIONING_TASK_STATUS_VALUES = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
] as const;
export type ProvisioningTaskStatus = (typeof PROVISIONING_TASK_STATUS_VALUES)[number];

export interface ProvisioningTaskRecord {
    id: string;
    orgId: string;
    employeeId: string;
    requestedByUserId: string;
    offboardingId?: string | null;
    taskType: ProvisioningTaskType;
    status: ProvisioningTaskStatus;
    systemKey?: string | null;
    accountIdentifier?: string | null;
    assetTag?: string | null;
    accessLevel?: string | null;
    instructions?: string | null;
    dueAt?: Date | string | null;
    completedAt?: Date | string | null;
    errorMessage?: string | null;
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

export interface ProvisioningTaskCreateInput {
    orgId: string;
    employeeId: string;
    requestedByUserId: string;
    offboardingId?: string | null;
    taskType: ProvisioningTaskType;
    systemKey?: string | null;
    accountIdentifier?: string | null;
    assetTag?: string | null;
    accessLevel?: string | null;
    instructions?: string | null;
    dueAt?: Date | string | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface ProvisioningTaskUpdateInput {
    status?: ProvisioningTaskStatus;
    systemKey?: string | null;
    accountIdentifier?: string | null;
    assetTag?: string | null;
    accessLevel?: string | null;
    instructions?: string | null;
    dueAt?: Date | null;
    completedAt?: Date | null;
    errorMessage?: string | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}
