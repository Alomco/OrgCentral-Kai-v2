import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getPerformanceReviewsForUi } from '@/server/use-cases/hr/performance/get-performance-reviews.cached';

import { HrPageHeader } from '../_components/hr-page-header';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';
import { PerformanceReviewsPanel } from './_components/performance-reviews-panel';
import { PerformanceStatsCard } from './_components/performance-stats-card';

type PerformanceReview = Awaited<ReturnType<typeof getPerformanceReviewsForUi>>['reviews'][number];

function isCompletedWithRating(
    review: PerformanceReview,
): review is PerformanceReview & { overallRating: number } {
    return (
        review.status === 'completed' &&
        review.overallRating !== null &&
        review.overallRating !== undefined
    );
}

function computeStats(reviews: Awaited<ReturnType<typeof getPerformanceReviewsForUi>>['reviews']) {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length;

    const completedReviews = reviews.filter(isCompletedWithRating);
    const avgRating = completedReviews.length > 0
        ? completedReviews.reduce((sum, r) => sum + r.overallRating, 0) / completedReviews.length
        : null;

    const futureReviews = reviews
        .filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    const firstFutureReview = futureReviews.at(0);
    const nextReview = firstFutureReview ? new Date(firstFutureReview.scheduledDate) : null;

    return { total, pending, avgRating, nextReview };
}

export default async function HrPerformancePage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:performance',
        },
    );

    const reviewsResult = await getPerformanceReviewsForUi({
        authorization,
        userId: authorization.userId,
    });

    const stats = computeStats(reviewsResult.reviews);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Performance</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Performance"
                description="Track your performance reviews and career goals."
                icon={<TrendingUp className="h-5 w-5" />}
            />

            <PerformanceStatsCard
                totalReviews={stats.total}
                pendingReviews={stats.pending}
                averageRating={stats.avgRating}
                nextReviewDate={stats.nextReview}
            />

            <Suspense fallback={<HrCardSkeleton variant="table" />}>
                <PerformanceReviewsPanel
                    authorization={authorization}
                    userId={authorization.userId}
                />
            </Suspense>
        </div>
    );
}
