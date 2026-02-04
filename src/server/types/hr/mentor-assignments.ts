import type { JsonRecord } from '@/server/types/json';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export const MENTOR_ASSIGNMENT_STATUS_VALUES = ['ACTIVE', 'ENDED'] as const;
export type MentorAssignmentStatus = (typeof MENTOR_ASSIGNMENT_STATUS_VALUES)[number];

export interface MentorAssignmentRecord {
    id: string;
    orgId: string;
    employeeId: string;
    mentorOrgId: string;
    mentorUserId: string;
    status: MentorAssignmentStatus;
    assignedAt: Date | string;
    endedAt?: Date | string | null;
    reason?: string | null;
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

export interface MentorAssignmentCreateInput {
    orgId: string;
    employeeId: string;
    mentorOrgId: string;
    mentorUserId: string;
    reason?: string | null;
    metadata?: JsonRecord | null;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    correlationId?: string | null;
    createdBy?: string | null;
}

export interface MentorAssignmentUpdateInput {
    status?: MentorAssignmentStatus;
    endedAt?: Date | null;
    reason?: string | null;
    metadata?: JsonRecord | null;
    updatedBy?: string | null;
}
