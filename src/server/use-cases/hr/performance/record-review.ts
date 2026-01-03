import type { PerformanceReview } from '@/server/domain/hr/performance/types';
import type {
    CreateReviewDTO,
    PerformanceRepository,
} from '@/server/repositories/contracts/hr/performance/performance-repository.contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import { appLogger } from '@/server/logging/structured-logger';

export interface RecordPerformanceReviewDependencies {
    repository: PerformanceRepository;
}

export interface RecordPerformanceReviewInput {
    authorization: RepositoryAuthorizationContext;
    review: CreateReviewDTO;
}

export interface RecordPerformanceReviewResult {
    review: PerformanceReview;
}

export async function recordPerformanceReview(
    deps: RecordPerformanceReviewDependencies,
    input: RecordPerformanceReviewInput,
): Promise<RecordPerformanceReviewResult> {
    assertNonEmpty(input.authorization.orgId, 'Organization ID');
    assertNonEmpty(input.review.employeeId, 'Employee ID');
    assertNonEmpty(input.review.reviewerUserId, 'Reviewer user ID');

    const review = await deps.repository.createReview(input.review);

    // Emit notification to the employee (subject of the review)
    try {
        await emitHrNotification(
            {},
            {
                authorization: input.authorization,
                notification: {
                    userId: input.review.employeeId, // employeeId currently represents the target user identifier
                    title: 'New Performance Review',
                    message: 'A new performance review has been created for you.',
                    type: 'performance-review',
                    priority: 'medium',
                    actionUrl: `/hr/performance/reviews/${review.id}`,
                    metadata: { reviewId: review.id },
                },
            },
        );
    } catch (error) {
        appLogger.warn('hr.performance.review.notification.failed', {
            reviewId: review.id,
            orgId: input.authorization.orgId,
            error: error instanceof Error ? error.message : 'unknown',
        });
    }

    return { review };
}
