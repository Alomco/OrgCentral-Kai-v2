import type { Prisma } from '@prisma/client';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export type AbsenceDurationType = 'DAYS' | 'HOURS';

export type AbsenceMetadata = Record<string, unknown> & {
    durationType?: AbsenceDurationType;
    startTime?: string;
    endTime?: string;
    acknowledgements?: AbsenceAcknowledgementEntry[];
    cancellation?: AbsenceCancellationMetadata;
    aiValidation?: AbsenceAiValidationMetadata;
    leaveBalanceAdjustments?: LeaveBalanceAdjustment[];
};

export interface AbsenceAcknowledgementEntry {
    userId: string;
    notedAt: string;
    note?: string | null;
}

export interface AbsenceCancellationMetadata {
    reason: string;
    cancelledByUserId: string;
    cancelledAt: string;
}

export interface AbsenceAiValidationMetadata {
    status: 'PENDING' | 'VERIFIED' | 'MISMATCH' | 'ERROR';
    summary?: string | null;
    issues?: string[];
    confidence?: number | null;
    checkedAt: string;
    attachmentId?: string;
    model?: string;
    orgId?: string;
    residencyTag?: DataResidencyZone;
    dataClassification?: DataClassificationLevel;
    retentionPolicyId?: string;
    auditSource?: string;
    correlationId?: string;
    processedAt?: string;
}

export interface LeaveBalanceAdjustment {
    balanceId: string;
    hours?: number;
    category?: 'used' | 'pending';
}

export function coerceAbsenceMetadata(value: Prisma.JsonValue | null | undefined): AbsenceMetadata {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return { ...(value as Record<string, unknown>) } as AbsenceMetadata;
}

export function mutateAbsenceMetadata(
    value: Prisma.JsonValue | null | undefined,
    updater: (metadata: AbsenceMetadata) => void,
): Prisma.JsonValue {
    const metadata = coerceAbsenceMetadata(value);
    updater(metadata);
    return metadata as Prisma.JsonValue;
}

export function mergeMetadata(target: AbsenceMetadata, extra: unknown): void {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
        return;
    }
    Object.assign(target, extra as Record<string, unknown>);
}
