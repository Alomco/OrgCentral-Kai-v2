import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    CreateGoalDTO,
    CreateReviewDTO,
    PerformanceRepository,
    UpdateGoalDTO,
    UpdateReviewDTO,
} from '@/server/repositories/contracts/hr/performance/performance-repository.contract';

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
