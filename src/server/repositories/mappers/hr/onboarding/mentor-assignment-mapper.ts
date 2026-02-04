import type { MentorAssignmentRecord } from '@/server/types/hr/mentor-assignments';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { JsonRecord } from '@/server/types/json';

export interface MentorAssignmentPrismaRecord {
    id: string;
    orgId: string;
    employeeId: string;
    mentorOrgId: string;
    mentorUserId: string;
    status: MentorAssignmentRecord['status'];
    assignedAt: Date | string;
    endedAt: Date | string | null;
    reason: string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: MentorAssignmentRecord['dataClassification'];
    residencyTag: MentorAssignmentRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapMentorAssignmentRecordToDomain(record: MentorAssignmentPrismaRecord): MentorAssignmentRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        mentorOrgId: record.mentorOrgId,
        mentorUserId: record.mentorUserId,
        status: record.status,
        assignedAt: record.assignedAt,
        endedAt: record.endedAt,
        reason: record.reason ?? undefined,
        metadata: (record.metadata ?? undefined) as JsonRecord | null | undefined,
        dataClassification: record.dataClassification,
        residencyTag: record.residencyTag,
        auditSource: record.auditSource ?? undefined,
        correlationId: record.correlationId ?? undefined,
        createdBy: record.createdBy ?? undefined,
        updatedBy: record.updatedBy ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
