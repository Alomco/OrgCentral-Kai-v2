import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import type {
    CreateGoalDTO,
    CreateReviewDTO,
    PerformanceRepository,
    UpdateGoalDTO,
    UpdateReviewDTO,
} from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import type { PerformanceGoal, PerformanceReview } from '@/server/domain/hr/performance/types';
import {
    addPerformanceGoal,
    deletePerformanceGoal,
    deletePerformanceReview,
    getPerformanceReview,
    listPerformanceGoalsByReview,
    listPerformanceReviews,
    recordPerformanceReview,
    updatePerformanceGoal,
    updatePerformanceReview,
} from '@/server/use-cases/hr/performance';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

export interface PerformanceServiceDependencies {
    /** Factory so repositories stay tenant-scoped and mockable in tests. */
    repositoryFactory: (orgId: string) => PerformanceRepository;
}

export interface GetPerformanceReviewInput {
    authorization: RepositoryAuthorizationContext;
    id: string;
}

export interface ListPerformanceReviewsByEmployeeInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
}

export interface ListPerformanceGoalsByReviewInput {
    authorization: RepositoryAuthorizationContext;
    reviewId: string;
}

export interface CreatePerformanceReviewInput {
    authorization: RepositoryAuthorizationContext;
    review: CreateReviewDTO;
}

export interface UpdatePerformanceReviewInput {
    authorization: RepositoryAuthorizationContext;
    id: string;
    updates: UpdateReviewDTO;
}

export interface AddPerformanceGoalInput {
    authorization: RepositoryAuthorizationContext;
    reviewId: string;
    goal: CreateGoalDTO;
}

export interface UpdatePerformanceGoalInput {
    authorization: RepositoryAuthorizationContext;
    goalId: string;
    updates: UpdateGoalDTO;
}

export interface DeletePerformanceReviewInput {
    authorization: RepositoryAuthorizationContext;
    id: string;
}

export interface DeletePerformanceGoalInput {
    authorization: RepositoryAuthorizationContext;
    goalId: string;
}

export class PerformanceService extends AbstractHrService {
    constructor(private readonly dependencies: PerformanceServiceDependencies) {
        super();
    }

    async getReviewById(input: GetPerformanceReviewInput): Promise<PerformanceReview | null> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.READ,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { reviewId: input.id },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.review.get',
                reviewId: input.id,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.review.get', async () => {
            const repository = this.repo(input.authorization);
            const { review } = await getPerformanceReview(
                { repository },
                { authorization: input.authorization, id: input.id },
            );
            return review;
        });
    }

    async getReviewsByEmployee(
        input: ListPerformanceReviewsByEmployeeInput,
    ): Promise<PerformanceReview[]> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.READ,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { employeeId: input.employeeId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.review.list',
                employeeId: input.employeeId,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.review.list', async () => {
            const repository = this.repo(input.authorization);
            const { reviews } = await listPerformanceReviews(
                { repository },
                { authorization: input.authorization, employeeId: input.employeeId },
            );
            return reviews;
        });
    }

    async getGoalsByReviewId(input: ListPerformanceGoalsByReviewInput): Promise<PerformanceGoal[]> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.READ,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { reviewId: input.reviewId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.goal.list',
                reviewId: input.reviewId,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.goal.list', async () => {
            const repository = this.repo(input.authorization);
            const { goals } = await listPerformanceGoalsByReview(
                { repository },
                { authorization: input.authorization, reviewId: input.reviewId },
            );
            return goals;
        });
    }

    async createReview(input: CreatePerformanceReviewInput): Promise<PerformanceReview> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.CREATE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { employeeId: input.review.employeeId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.review.create',
                employeeId: input.review.employeeId,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.review.create', async () => {
            const repository = this.repo(input.authorization);
            const { review } = await recordPerformanceReview(
                { repository },
                { authorization: input.authorization, review: input.review },
            );
            return review;
        });
    }

    async updateReview(input: UpdatePerformanceReviewInput): Promise<PerformanceReview> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { reviewId: input.id },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.review.update',
                reviewId: input.id,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.review.update', async () => {
            const repository = this.repo(input.authorization);
            const { review } = await updatePerformanceReview(
                { repository },
                { authorization: input.authorization, id: input.id, updates: input.updates },
            );
            return review;
        });
    }

    async addGoal(input: AddPerformanceGoalInput): Promise<PerformanceGoal> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.CREATE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { reviewId: input.reviewId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.goal.create',
                reviewId: input.reviewId,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.goal.create', async () => {
            const repository = this.repo(input.authorization);
            const { goal } = await addPerformanceGoal(
                { repository },
                { authorization: input.authorization, reviewId: input.reviewId, goal: input.goal },
            );
            return goal;
        });
    }

    async updateGoal(input: UpdatePerformanceGoalInput): Promise<PerformanceGoal> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { goalId: input.goalId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.goal.update',
                goalId: input.goalId,
            },
        });

        return this.executeInServiceContext(context, 'hr.performance.goal.update', async () => {
            const repository = this.repo(input.authorization);
            const { goal } = await updatePerformanceGoal(
                { repository },
                { authorization: input.authorization, goalId: input.goalId, updates: input.updates },
            );
            return goal;
        });
    }

    async deleteReview(input: DeletePerformanceReviewInput): Promise<{ success: true }> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.DELETE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { reviewId: input.id },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.review.delete',
                reviewId: input.id,
            },
        });

        await this.executeInServiceContext(context, 'hr.performance.review.delete', async () => {
            const repository = this.repo(input.authorization);
            await deletePerformanceReview(
                { repository },
                { authorization: input.authorization, id: input.id },
            );
        });

        return { success: true };
    }

    async deleteGoal(input: DeletePerformanceGoalInput): Promise<{ success: true }> {
        await this.ensureOrgAccess(input.authorization, {
            action: HR_ACTION.DELETE,
            resourceType: HR_RESOURCE.HR_PERFORMANCE,
            resourceAttributes: { goalId: input.goalId },
        });

        const context = this.buildContext(input.authorization, {
            metadata: {
                auditSource: 'service:hr.performance.goal.delete',
                goalId: input.goalId,
            },
        });

        await this.executeInServiceContext(context, 'hr.performance.goal.delete', async () => {
            const repository = this.repo(input.authorization);
            await deletePerformanceGoal(
                { repository },
                { authorization: input.authorization, goalId: input.goalId },
            );
        });

        return { success: true };
    }

    private repo(authorization: RepositoryAuthorizationContext): PerformanceRepository {
        return this.dependencies.repositoryFactory(authorization.orgId);
    }

    protected buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId,
            metadata: options?.metadata,
        };
    }
}
