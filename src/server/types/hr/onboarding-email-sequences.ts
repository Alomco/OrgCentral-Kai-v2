import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const EMAIL_SEQUENCE_TRIGGER_VALUES = [
    'ONBOARDING_INVITE',
    'ONBOARDING_ACCEPTED',
    'OFFBOARDING_STARTED',
] as const;
export type EmailSequenceTrigger = (typeof EMAIL_SEQUENCE_TRIGGER_VALUES)[number];

export const EMAIL_SEQUENCE_STATUS_VALUES = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
export type EmailSequenceStatus = (typeof EMAIL_SEQUENCE_STATUS_VALUES)[number];

export const EMAIL_SEQUENCE_DELIVERY_STATUS_VALUES = ['QUEUED', 'SENT', 'FAILED', 'SKIPPED'] as const;
export type EmailSequenceDeliveryStatus = (typeof EMAIL_SEQUENCE_DELIVERY_STATUS_VALUES)[number];

export interface EmailSequenceTemplateRecord {
    id: string;
    orgId: string;
    name: string;
    description?: string | null;
    trigger: EmailSequenceTrigger;
    isActive: boolean;
    steps: JsonValue;
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

export interface EmailSequenceEnrollmentRecord {
    id: string;
    orgId: string;
    templateId: string;
    employeeId?: string | null;
    invitationToken?: string | null;
    targetEmail: string;
    status: EmailSequenceStatus;
    startedAt: Date | string;
    pausedAt?: Date | string | null;
    completedAt?: Date | string | null;
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

export interface EmailSequenceDeliveryRecord {
    id: string;
    orgId: string;
    enrollmentId: string;
    stepKey: string;
    scheduledAt: Date | string;
    sentAt?: Date | string | null;
    status: EmailSequenceDeliveryStatus;
    provider?: string | null;
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

export interface EmailSequenceTemplateCreateInput {
    orgId: string;
    name: string;
    description?: string | null;
    trigger: EmailSequenceTrigger;
    isActive?: boolean;
    steps: JsonValue;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface EmailSequenceTemplateUpdateInput {
    name?: string;
    description?: string | null;
    trigger?: EmailSequenceTrigger;
    isActive?: boolean;
    steps?: JsonValue;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}

export interface EmailSequenceEnrollmentCreateInput {
    orgId: string;
    templateId: string;
    employeeId?: string | null;
    invitationToken?: string | null;
    targetEmail: string;
    startedAt?: Date | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface EmailSequenceEnrollmentUpdateInput {
    status?: EmailSequenceStatus;
    pausedAt?: Date | null;
    completedAt?: Date | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}

export interface EmailSequenceDeliveryCreateInput {
    orgId: string;
    enrollmentId: string;
    stepKey: string;
    scheduledAt: Date;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface EmailSequenceDeliveryUpdateInput {
    status?: EmailSequenceDeliveryStatus;
    sentAt?: Date | null;
    provider?: string | null;
    errorMessage?: string | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}
