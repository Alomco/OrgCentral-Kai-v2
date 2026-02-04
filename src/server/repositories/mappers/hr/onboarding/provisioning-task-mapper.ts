import type { ProvisioningTaskRecord } from '@/server/types/hr/provisioning-tasks';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { JsonRecord } from '@/server/types/json';

export interface ProvisioningTaskPrismaRecord {
    id: string;
    orgId: string;
    employeeId: string;
    requestedByUserId: string;
    offboardingId: string | null;
    taskType: ProvisioningTaskRecord['taskType'];
    status: ProvisioningTaskRecord['status'];
    systemKey: string | null;
    accountIdentifier: string | null;
    assetTag: string | null;
    accessLevel: string | null;
    instructions: string | null;
    dueAt: Date | string | null;
    completedAt: Date | string | null;
    errorMessage: string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: ProvisioningTaskRecord['dataClassification'];
    residencyTag: ProvisioningTaskRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapProvisioningTaskRecordToDomain(record: ProvisioningTaskPrismaRecord): ProvisioningTaskRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        requestedByUserId: record.requestedByUserId,
        offboardingId: record.offboardingId ?? undefined,
        taskType: record.taskType,
        status: record.status,
        systemKey: record.systemKey ?? undefined,
        accountIdentifier: record.accountIdentifier ?? undefined,
        assetTag: record.assetTag ?? undefined,
        accessLevel: record.accessLevel ?? undefined,
        instructions: record.instructions ?? undefined,
        dueAt: record.dueAt ?? undefined,
        completedAt: record.completedAt ?? undefined,
        errorMessage: record.errorMessage ?? undefined,
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
