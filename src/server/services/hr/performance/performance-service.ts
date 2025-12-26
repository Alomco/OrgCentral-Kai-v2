import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import type { PerformanceGoal, PerformanceReview } from '@/server/domain/hr/performance/types';
import type { PerformanceRepository } from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import type {
    AddPerformanceGoalInput,
    CreatePerformanceReviewInput,
    DeletePerformanceGoalInput,
    DeletePerformanceReviewInput,
    GetPerformanceReviewInput,
    ListPerformanceGoalsByReviewInput,
    ListPerformanceReviewsByEmployeeInput,
    PerformanceServiceDependencies,
    UpdatePerformanceGoalInput,
    UpdatePerformanceReviewInput,
} from './performance-service.types';
import {
    handleAddGoal,
    handleCreateReview,
    handleDeleteGoal,
    handleDeleteReview,
    handleGetGoalsByReviewId,
    handleGetReviewById,
    handleGetReviewsByEmployee,
    handleUpdateGoal,
    handleUpdateReview,
    type PerformanceServiceRuntime,
} from './performance-service.operations';

export type {
    AddPerformanceGoalInput,
    CreatePerformanceReviewInput,
    DeletePerformanceGoalInput,
    DeletePerformanceReviewInput,
    GetPerformanceReviewInput,
    ListPerformanceGoalsByReviewInput,
    ListPerformanceReviewsByEmployeeInput,
    PerformanceServiceDependencies,
    UpdatePerformanceGoalInput,
    UpdatePerformanceReviewInput,
} from './performance-service.types';

export class PerformanceService extends AbstractHrService {
    private readonly runtime: PerformanceServiceRuntime;

    constructor(private readonly dependencies: PerformanceServiceDependencies) {
        super();
        this.runtime = {
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: this.buildContext.bind(this),
            executeInServiceContext: this.executeInServiceContext.bind(this),
            repo: this.repo.bind(this),
        };
    }

    async getReviewById(input: GetPerformanceReviewInput): Promise<PerformanceReview | null> {
        return handleGetReviewById(this.runtime, input);
    }

    async getReviewsByEmployee(
        input: ListPerformanceReviewsByEmployeeInput,
    ): Promise<PerformanceReview[]> {
        return handleGetReviewsByEmployee(this.runtime, input);
    }

    async getGoalsByReviewId(input: ListPerformanceGoalsByReviewInput): Promise<PerformanceGoal[]> {
        return handleGetGoalsByReviewId(this.runtime, input);
    }

    async createReview(input: CreatePerformanceReviewInput): Promise<PerformanceReview> {
        return handleCreateReview(this.runtime, input);
    }

    async updateReview(input: UpdatePerformanceReviewInput): Promise<PerformanceReview> {
        return handleUpdateReview(this.runtime, input);
    }

    async addGoal(input: AddPerformanceGoalInput): Promise<PerformanceGoal> {
        return handleAddGoal(this.runtime, input);
    }

    async updateGoal(input: UpdatePerformanceGoalInput): Promise<PerformanceGoal> {
        return handleUpdateGoal(this.runtime, input);
    }

    async deleteReview(input: DeletePerformanceReviewInput): Promise<{ success: true }> {
        return handleDeleteReview(this.runtime, input);
    }

    async deleteGoal(input: DeletePerformanceGoalInput): Promise<{ success: true }> {
        return handleDeleteGoal(this.runtime, input);
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
