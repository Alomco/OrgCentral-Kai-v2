import type { Prisma, PrismaClient } from '@prisma/client';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    CreateGoalDTO,
    CreateReviewDTO,
    PerformanceRepository,
    UpdateGoalDTO,
    UpdateReviewDTO,
} from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import { mapPrismaPerformanceReviewToDomain } from '@/server/repositories/mappers/hr/performance/performance-mapper';
import { mapPrismaPerformanceGoalToDomain } from '@/server/repositories/mappers/hr/performance/performance-goal-mapper';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { EntityNotFoundError } from '@/server/errors';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PERFORMANCE_GOALS, CACHE_SCOPE_PERFORMANCE_REVIEWS } from '@/server/repositories/cache-scopes';
import { buildGoalUpdateData, buildReviewUpdateData } from './prisma-performance-repository.helpers';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { CacheScope } from '@/server/repositories/cache-scopes';

type ReviewDelegate = PrismaClient['performanceReview'];
type GoalDelegate = PrismaClient['performanceGoal'];

const PERFORMANCE_REVIEW_ENTITY = 'Performance review';

export class PrismaPerformanceRepository extends BasePrismaRepository implements PerformanceRepository {
    private readonly orgId: string;
    private readonly reviews: ReviewDelegate;
    private readonly goals: GoalDelegate;
    private readonly classification: DataClassificationLevel;
    private readonly residency: DataResidencyZone;

    constructor(
        orgId: string,
        classification: DataClassificationLevel,
        residency: DataResidencyZone,
        options: BasePrismaRepositoryOptions = {},
    ) {
        super(options);
        this.orgId = orgId;
        this.classification = classification;
        this.residency = residency;
        this.reviews = this.prisma.performanceReview;
        this.goals = this.prisma.performanceGoal;
    }

    async getReviewById(id: string) {
        const record = await this.reviews.findUnique({ where: { id } });
        if (!record || record.orgId !== this.orgId) {
            return null;
        }

        const reviewScope = CACHE_SCOPE_PERFORMANCE_REVIEWS;
        registerOrgCacheTag(
            this.orgId,
            reviewScope,
            this.classification,
            this.residency,
        );
        return mapPrismaPerformanceReviewToDomain(record);
    }

    async getReviewsByEmployee(employeeId: string) {
        const records = await this.reviews.findMany({
            where: { orgId: this.orgId, userId: employeeId },
            orderBy: { scheduledDate: 'desc' },
        });

        const reviewScope = CACHE_SCOPE_PERFORMANCE_REVIEWS;
        registerOrgCacheTag(
            this.orgId,
            reviewScope,
            this.classification,
            this.residency,
        );
        return records.map(mapPrismaPerformanceReviewToDomain);
    }

    async getGoalsByReviewId(reviewId: string) {
        const review = await this.reviews.findUnique({ where: { id: reviewId } });
        if (!review || review.orgId !== this.orgId) {
            return [];
        }

        const records = await this.goals.findMany({
            where: { orgId: this.orgId, reviewId },
            orderBy: { targetDate: 'asc' },
        });

        const goalScope = CACHE_SCOPE_PERFORMANCE_GOALS;
        registerOrgCacheTag(
            this.orgId,
            goalScope,
            this.classification,
            this.residency,
        );

        return records.map(mapPrismaPerformanceGoalToDomain);
    }

    async createReview(data: CreateReviewDTO) {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const record = await this.reviews.create({
            data: {
                orgId: this.orgId,
                userId: data.employeeId,
                reviewerOrgId: this.orgId,
                reviewerUserId: data.reviewerUserId,
                periodStartDate: data.periodStartDate,
                periodEndDate: data.periodEndDate,
                scheduledDate: data.scheduledDate,
                completedDate: data.completedDate ?? null,
                status: data.status ?? 'scheduled',
                overallRating: data.overallRating ?? null,
                strengths: data.strengths ?? null,
                areasForImprovement: data.areasForImprovement ?? null,
                developmentPlan:
                    toPrismaInputJson(
                        data.developmentPlan as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
                    ) ?? undefined,
                reviewerNotes: data.reviewerNotes ?? null,
                employeeResponse: data.employeeResponse ?? null,
                metadata:
                    toPrismaInputJson(
                        data.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
                    ) ?? undefined,
            },
        });

        await this.invalidateAfterWrite(this.orgId, scopes);

        return mapPrismaPerformanceReviewToDomain(record);
    }

    async updateReview(id: string, data: UpdateReviewDTO) {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const existing = await this.reviews.findUnique({ where: { id } });
        if (!existing || existing.orgId !== this.orgId) {
            throw new EntityNotFoundError(PERFORMANCE_REVIEW_ENTITY, { id, orgId: this.orgId });
        }

        const updateData = buildReviewUpdateData(data);

        const updated = await this.reviews.update({ where: { id }, data: updateData });

        await this.invalidateAfterWrite(this.orgId, scopes);

        return mapPrismaPerformanceReviewToDomain(updated);
    }

    async addGoal(reviewId: string, goal: CreateGoalDTO) {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const review = await this.reviews.findUnique({ where: { id: reviewId } });
        if (!review || review.orgId !== this.orgId) {
            throw new EntityNotFoundError(PERFORMANCE_REVIEW_ENTITY, { id: reviewId, orgId: this.orgId });
        }

        const record = await this.goals.create({
            data: {
                orgId: this.orgId,
                reviewId,
                description: goal.description,
                targetDate: goal.targetDate,
                status: (goal.status ?? 'PENDING') as Prisma.PerformanceGoalUncheckedCreateInput['status'],
                rating: goal.rating ?? null,
                comments: goal.comments ?? null,
            },
        });

        await this.invalidateAfterWrite(this.orgId, scopes);

        return mapPrismaPerformanceGoalToDomain(record);
    }

    async updateGoal(goalId: string, data: UpdateGoalDTO) {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const existing = await this.goals.findUnique({ where: { id: goalId } });
        if (!existing || existing.orgId !== this.orgId) {
            throw new EntityNotFoundError('Performance goal', { id: goalId, orgId: this.orgId });
        }

        const updateData = buildGoalUpdateData(data);

        const updated = await this.goals.update({ where: { id: goalId }, data: updateData });

        await this.invalidateAfterWrite(this.orgId, scopes);

        return mapPrismaPerformanceGoalToDomain(updated);
    }

    async deleteGoal(goalId: string): Promise<void> {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const existing = await this.goals.findUnique({ where: { id: goalId } });
        if (!existing || existing.orgId !== this.orgId) {
            throw new EntityNotFoundError('Performance goal', { id: goalId, orgId: this.orgId });
        }

        await this.goals.delete({ where: { id: goalId } });
        await this.invalidateAfterWrite(this.orgId, scopes);
    }

    async deleteReview(id: string): Promise<void> {
        const scopes: CacheScope[] = [
            CACHE_SCOPE_PERFORMANCE_REVIEWS,
            CACHE_SCOPE_PERFORMANCE_GOALS,
        ];

        const existing = await this.reviews.findUnique({ where: { id } });
        if (!existing || existing.orgId !== this.orgId) {
            throw new EntityNotFoundError(PERFORMANCE_REVIEW_ENTITY, { id, orgId: this.orgId });
        }

        await this.reviews.delete({ where: { id } });
        await this.invalidateAfterWrite(this.orgId, scopes);
    }
}
