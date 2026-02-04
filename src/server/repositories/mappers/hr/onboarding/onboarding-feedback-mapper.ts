import type { JsonRecord } from '@/server/types/json';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { OnboardingFeedbackRecord } from '@/server/types/hr/onboarding-feedback';

export interface OnboardingFeedbackPrismaRecord {
    id: string;
    orgId: string;
    employeeId: string;
    rating: number;
    summary: string | null;
    comments: string | null;
    submittedAt: Date | string;
    metadata: PrismaJsonValue | null;
    dataClassification: OnboardingFeedbackRecord['dataClassification'];
    residencyTag: OnboardingFeedbackRecord['residencyTag'];
    auditSource: string | null;
    correlationId: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export function mapOnboardingFeedbackRecordToDomain(record: OnboardingFeedbackPrismaRecord): OnboardingFeedbackRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        employeeId: record.employeeId,
        rating: record.rating,
        summary: record.summary ?? undefined,
        comments: record.comments ?? undefined,
        submittedAt: record.submittedAt,
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
