import type { PerformanceGoal, PerformanceReview } from '@/server/domain/hr/performance/types';
import {
    getPerformanceReview,
    listPerformanceGoalsByReview,
    listPerformanceReviews,
} from '@/server/use-cases/hr/performance';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type {
    GetPerformanceReviewInput,
    ListPerformanceGoalsByReviewInput,
    ListPerformanceReviewsByEmployeeInput,
} from './performance-service.types';
import type { PerformanceServiceRuntime } from './performance-service.operations.types';

export async function handleGetReviewById(
    runtime: PerformanceServiceRuntime,
    input: GetPerformanceReviewInput,
): Promise<PerformanceReview | null> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { reviewId: input.id },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.review.get',
            reviewId: input.id,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.review.get', async () => {
        const repository = runtime.repo(input.authorization);
        const { review } = await getPerformanceReview(
            { repository },
            { authorization: input.authorization, id: input.id },
        );
        return review;
    });
}

export async function handleGetReviewsByEmployee(
    runtime: PerformanceServiceRuntime,
    input: ListPerformanceReviewsByEmployeeInput,
): Promise<PerformanceReview[]> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { employeeId: input.employeeId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.review.list',
            employeeId: input.employeeId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.review.list', async () => {
        const repository = runtime.repo(input.authorization);
        const { reviews } = await listPerformanceReviews(
            { repository },
            { authorization: input.authorization, employeeId: input.employeeId },
        );
        return reviews;
    });
}

export async function handleGetGoalsByReviewId(
    runtime: PerformanceServiceRuntime,
    input: ListPerformanceGoalsByReviewInput,
): Promise<PerformanceGoal[]> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { reviewId: input.reviewId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.goal.list',
            reviewId: input.reviewId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.goal.list', async () => {
        const repository = runtime.repo(input.authorization);
        const { goals } = await listPerformanceGoalsByReview(
            { repository },
            { authorization: input.authorization, reviewId: input.reviewId },
        );
        return goals;
    });
}
