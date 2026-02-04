import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type {
    EmailSequenceDeliveryRecord,
    EmailSequenceEnrollmentRecord,
    EmailSequenceTemplateRecord,
} from '@/server/types/hr/onboarding-email-sequences';

export interface EmailSequenceTemplatePrismaRecord {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    trigger: EmailSequenceTemplateRecord['trigger'];
    isActive: boolean;
    steps: PrismaJsonValue;
    metadata: PrismaJsonValue | null;
    dataClassification: EmailSequenceTemplateRecord['dataClassification'];
    residencyTag: EmailSequenceTemplateRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface EmailSequenceEnrollmentPrismaRecord {
    id: string;
    orgId: string;
    templateId: string;
    employeeId: string | null;
    invitationToken: string | null;
    targetEmail: string;
    status: EmailSequenceEnrollmentRecord['status'];
    startedAt: Date | string;
    pausedAt: Date | string | null;
    completedAt: Date | string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: EmailSequenceEnrollmentRecord['dataClassification'];
    residencyTag: EmailSequenceEnrollmentRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface EmailSequenceDeliveryPrismaRecord {
    id: string;
    orgId: string;
    enrollmentId: string;
    stepKey: string;
    scheduledAt: Date | string;
    sentAt: Date | string | null;
    status: EmailSequenceDeliveryRecord['status'];
    provider: string | null;
    errorMessage: string | null;
    metadata: PrismaJsonValue | null;
    dataClassification: EmailSequenceDeliveryRecord['dataClassification'];
    residencyTag: EmailSequenceDeliveryRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapEmailSequenceTemplateRecordToDomain(
    record: EmailSequenceTemplatePrismaRecord,
): EmailSequenceTemplateRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        description: record.description ?? undefined,
        trigger: record.trigger,
        isActive: record.isActive,
        steps: record.steps as JsonValue,
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

export function mapEmailSequenceEnrollmentRecordToDomain(
    record: EmailSequenceEnrollmentPrismaRecord,
): EmailSequenceEnrollmentRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        templateId: record.templateId,
        employeeId: record.employeeId ?? undefined,
        invitationToken: record.invitationToken ?? undefined,
        targetEmail: record.targetEmail,
        status: record.status,
        startedAt: record.startedAt,
        pausedAt: record.pausedAt ?? undefined,
        completedAt: record.completedAt ?? undefined,
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

export function mapEmailSequenceDeliveryRecordToDomain(
    record: EmailSequenceDeliveryPrismaRecord,
): EmailSequenceDeliveryRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        enrollmentId: record.enrollmentId,
        stepKey: record.stepKey,
        scheduledAt: record.scheduledAt,
        sentAt: record.sentAt ?? undefined,
        status: record.status,
        provider: record.provider ?? undefined,
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
