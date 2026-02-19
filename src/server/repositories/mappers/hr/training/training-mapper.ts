import { Prisma, type TrainingRecord as PrismaTrainingRecord } from '../../../../../generated/client';
import type { TrainingRecord as DomainTrainingRecord } from '@/server/types/hr-types';
import type { TrainingRecordCreationData, TrainingRecordUpdateData } from '@/server/repositories/prisma/hr/training/prisma-training-record-repository.types';

type TrainingRecordRow = PrismaTrainingRecord;

const decimalToNumber = (value: number | { toNumber: () => number } | null | undefined): number | null => {
    if (value === null || value === undefined) { return null; }
    if (typeof value === 'number') { return value; }
    try {
        return value.toNumber();
    } catch {
        return null;
    }
};

const toJsonInput = (
    value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
};

export function mapPrismaTrainingRecordToDomain(record: TrainingRecordRow): DomainTrainingRecord {
    return {
        id: record.id,
        orgId: record.orgId,
        userId: record.userId,
        courseName: record.courseName,
        provider: record.provider,
        startDate: record.startDate,
        endDate: record.endDate ?? null,
        expiryDate: record.expiryDate ?? null,
        renewalDate: record.renewalDate ?? null,
        status: record.status,
        certificate: record.certificate ?? null,
        competency: record.competency ?? null,
        cost: decimalToNumber(record.cost),
        approved: record.approved,
        approvedAt: record.approvedAt ?? null,
        approvedBy: record.approvedBy ?? null,
        metadata: record.metadata,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export function mapDomainTrainingRecordToPrisma(input: DomainTrainingRecord): TrainingRecordCreationData {
    return {
        orgId: input.orgId,
        userId: input.userId,
        courseName: input.courseName,
        provider: input.provider,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        expiryDate: input.expiryDate ?? null,
        renewalDate: input.renewalDate ?? null,
        status: input.status,
        certificate: input.certificate ?? null,
        competency: toJsonInput(input.competency),
        cost: input.cost ?? null,
        approved: input.approved,
        approvedAt: input.approvedAt ?? null,
        approvedBy: input.approvedBy ?? null,
        metadata: toJsonInput(input.metadata),
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
    };
}

export function mapDomainTrainingUpdateToPrisma(input: Partial<Omit<DomainTrainingRecord, 'id' | 'orgId' | 'createdAt' | 'userId'>>): Partial<TrainingRecordUpdateData> {
    const update: Partial<TrainingRecordUpdateData> = {};
    if (input.startDate !== undefined) { update.startDate = input.startDate; }
    if (input.endDate !== undefined) { update.endDate = input.endDate ?? null; }
    if (input.expiryDate !== undefined) { update.expiryDate = input.expiryDate ?? null; }
    if (input.renewalDate !== undefined) { update.renewalDate = input.renewalDate ?? null; }
    if (input.status !== undefined) { update.status = input.status; }
    if (input.certificate !== undefined) { update.certificate = input.certificate ?? null; }
    if (input.competency !== undefined) { update.competency = toJsonInput(input.competency); }
    if (input.cost !== undefined) { update.cost = input.cost ?? null; }
    if (input.approved !== undefined) { update.approved = input.approved; }
    if (input.approvedAt !== undefined) { update.approvedAt = input.approvedAt ?? null; }
    if (input.approvedBy !== undefined) { update.approvedBy = input.approvedBy ?? null; }
    if (input.metadata !== undefined) { update.metadata = toJsonInput(input.metadata); }
    if (input.courseName !== undefined) { update.courseName = input.courseName; }
    if (input.provider !== undefined) { update.provider = input.provider; }
    return update;
}
