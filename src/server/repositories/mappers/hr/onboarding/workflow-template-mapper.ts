import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type {
    OnboardingWorkflowRunRecord,
    OnboardingWorkflowTemplateRecord,
} from '@/server/types/hr/onboarding-workflow-templates';

export interface WorkflowTemplatePrismaRecord {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    templateType: OnboardingWorkflowTemplateRecord['templateType'];
    version: number;
    isActive: boolean;
    definition: PrismaJsonValue;
    metadata: PrismaJsonValue | null;
    dataClassification: OnboardingWorkflowTemplateRecord['dataClassification'];
    residencyTag: OnboardingWorkflowTemplateRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface WorkflowRunPrismaRecord {
    id: string;
    orgId: string;
    employeeId: string;
    templateId: string;
    offboardingId: string | null;
    status: OnboardingWorkflowRunRecord['status'];
    currentStepKey: string | null;
    startedAt: Date | string;
    completedAt: Date | string | null;
    canceledAt: Date | string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: OnboardingWorkflowRunRecord['dataClassification'];
    residencyTag: OnboardingWorkflowRunRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapWorkflowTemplateRecordToDomain(
    record: WorkflowTemplatePrismaRecord,
): OnboardingWorkflowTemplateRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        description: record.description ?? undefined,
        templateType: record.templateType,
        version: record.version,
        isActive: record.isActive,
        definition: record.definition as JsonValue,
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

export function mapWorkflowRunRecordToDomain(record: WorkflowRunPrismaRecord): OnboardingWorkflowRunRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        templateId: record.templateId,
        offboardingId: record.offboardingId ?? undefined,
        status: record.status,
        currentStepKey: record.currentStepKey ?? undefined,
        startedAt: record.startedAt,
        completedAt: record.completedAt ?? undefined,
        canceledAt: record.canceledAt ?? undefined,
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
