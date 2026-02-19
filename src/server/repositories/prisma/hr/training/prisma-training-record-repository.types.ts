import type { Prisma } from '@prisma/client';

export interface TrainingRecordFilters {
    orgId?: string;
    userId?: string;
    courseName?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    expiryBefore?: Date;
    expiryAfter?: Date;
}

export type TrainingRecordCreationData = Prisma.TrainingRecordUncheckedCreateInput;

export type TrainingRecordUpdateData = Prisma.TrainingRecordUncheckedUpdateInput;
