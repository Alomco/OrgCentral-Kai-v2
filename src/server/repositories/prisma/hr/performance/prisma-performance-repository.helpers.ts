import { Prisma } from '../../../../../generated/client';
import type {
    UpdateGoalDTO,
    UpdateReviewDTO,
} from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';

export function buildReviewUpdateData(
    data: UpdateReviewDTO,
): Prisma.PerformanceReviewUncheckedUpdateInput {
    const updateData: Prisma.PerformanceReviewUncheckedUpdateInput = {};

    if (data.periodStartDate !== undefined) {
        updateData.periodStartDate = data.periodStartDate;
    }
    if (data.periodEndDate !== undefined) {
        updateData.periodEndDate = data.periodEndDate;
    }
    if (data.scheduledDate !== undefined) {
        updateData.scheduledDate = data.scheduledDate;
    }
    if (data.completedDate !== undefined) {
        updateData.completedDate = data.completedDate ?? null;
    }
    if (data.status !== undefined) {
        updateData.status = data.status;
    }
    if (data.overallRating !== undefined) {
        updateData.overallRating = data.overallRating ?? null;
    }
    if (data.strengths !== undefined) {
        updateData.strengths = data.strengths ?? null;
    }
    if (data.areasForImprovement !== undefined) {
        updateData.areasForImprovement = data.areasForImprovement ?? null;
    }
    if (data.developmentPlan !== undefined) {
        updateData.developmentPlan =
            toPrismaInputJson(
                data.developmentPlan as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
            ) ?? Prisma.JsonNull;
    }
    if (data.reviewerNotes !== undefined) {
        updateData.reviewerNotes = data.reviewerNotes ?? null;
    }
    if (data.employeeResponse !== undefined) {
        updateData.employeeResponse = data.employeeResponse ?? null;
    }
    if (data.metadata !== undefined) {
        updateData.metadata =
            toPrismaInputJson(
                data.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
            ) ?? Prisma.JsonNull;
    }

    return updateData;
}

export function buildGoalUpdateData(
    data: UpdateGoalDTO,
): Prisma.PerformanceGoalUncheckedUpdateInput {
    const updateData: Prisma.PerformanceGoalUncheckedUpdateInput = {};

    if (data.description !== undefined) {
        updateData.description = data.description;
    }
    if (data.targetDate !== undefined) {
        updateData.targetDate = data.targetDate;
    }
    if (data.status !== undefined) {
        updateData.status = data.status as Prisma.PerformanceGoalUncheckedUpdateInput['status'];
    }
    if (data.rating !== undefined) {
        updateData.rating = data.rating ?? null;
    }
    if (data.comments !== undefined) {
        updateData.comments = data.comments ?? null;
    }

    return updateData;
}
