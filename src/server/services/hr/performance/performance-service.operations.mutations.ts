import type { PerformanceGoal, PerformanceReview } from '@/server/domain/hr/performance/types';
import {
    addPerformanceGoal,
    deletePerformanceGoal,
    deletePerformanceReview,
    recordPerformanceReview,
    updatePerformanceGoal,
    updatePerformanceReview,
} from '@/server/use-cases/hr/performance';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type {
    AddPerformanceGoalInput,
    CreatePerformanceReviewInput,
    DeletePerformanceGoalInput,
    DeletePerformanceReviewInput,
    UpdatePerformanceGoalInput,
    UpdatePerformanceReviewInput,
} from './performance-service.types';
import type { PerformanceServiceRuntime } from './performance-service.operations.types';

export async function handleCreateReview(
    runtime: PerformanceServiceRuntime,
    input: CreatePerformanceReviewInput,
): Promise<PerformanceReview> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { employeeId: input.review.employeeId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.review.create',
            employeeId: input.review.employeeId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.review.create', async () => {
        const repository = runtime.repo(input.authorization);
        const { review } = await recordPerformanceReview(
            { repository },
            { authorization: input.authorization, review: input.review },
        );
        return review;
    });
}

export async function handleUpdateReview(
    runtime: PerformanceServiceRuntime,
    input: UpdatePerformanceReviewInput,
): Promise<PerformanceReview> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { reviewId: input.id },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.review.update',
            reviewId: input.id,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.review.update', async () => {
        const repository = runtime.repo(input.authorization);
        const { review } = await updatePerformanceReview(
            { repository },
            { authorization: input.authorization, id: input.id, updates: input.updates },
        );
        return review;
    });
}

export async function handleAddGoal(
    runtime: PerformanceServiceRuntime,
    input: AddPerformanceGoalInput,
): Promise<PerformanceGoal> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { reviewId: input.reviewId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.goal.create',
            reviewId: input.reviewId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.goal.create', async () => {
        const repository = runtime.repo(input.authorization);
        const { goal } = await addPerformanceGoal(
            { repository },
            { authorization: input.authorization, reviewId: input.reviewId, goal: input.goal },
        );
        return goal;
    });
}

export async function handleUpdateGoal(
    runtime: PerformanceServiceRuntime,
    input: UpdatePerformanceGoalInput,
): Promise<PerformanceGoal> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { goalId: input.goalId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.goal.update',
            goalId: input.goalId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.performance.goal.update', async () => {
        const repository = runtime.repo(input.authorization);
        const { goal } = await updatePerformanceGoal(
            { repository },
            { authorization: input.authorization, goalId: input.goalId, updates: input.updates },
        );
        return goal;
    });
}

export async function handleDeleteReview(
    runtime: PerformanceServiceRuntime,
    input: DeletePerformanceReviewInput,
): Promise<{ success: true }> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.DELETE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { reviewId: input.id },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.review.delete',
            reviewId: input.id,
        },
    });

    await runtime.executeInServiceContext(context, 'hr.performance.review.delete', async () => {
        const repository = runtime.repo(input.authorization);
        await deletePerformanceReview(
            { repository },
            { authorization: input.authorization, id: input.id },
        );
    });

    return { success: true };
}

export async function handleDeleteGoal(
    runtime: PerformanceServiceRuntime,
    input: DeletePerformanceGoalInput,
): Promise<{ success: true }> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.DELETE,
        resourceType: HR_RESOURCE.HR_PERFORMANCE,
        resourceAttributes: { goalId: input.goalId },
    });

    const context = runtime.buildContext(input.authorization, {
        metadata: {
            auditSource: 'service:hr.performance.goal.delete',
            goalId: input.goalId,
        },
    });

    await runtime.executeInServiceContext(context, 'hr.performance.goal.delete', async () => {
        const repository = runtime.repo(input.authorization);
        await deletePerformanceGoal(
            { repository },
            { authorization: input.authorization, goalId: input.goalId },
        );
    });

    return { success: true };
}
