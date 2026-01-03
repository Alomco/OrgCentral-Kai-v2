import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getPerformanceReviewsForUi } from '@/server/use-cases/hr/performance/get-performance-reviews.cached';

import { formatHumanDate } from '../../_components/format-date';
import { HrDataTable, type HrDataTableColumn } from '../../_components/hr-data-table';
import { HrStatusBadge } from '../../_components/hr-status-badge';

export interface PerformanceReviewsPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    title?: string;
    description?: string;
}

const COLUMNS: readonly HrDataTableColumn[] = [
    { key: 'period', label: 'Review Period' },
    { key: 'scheduled', label: 'Scheduled Date' },
    { key: 'status', label: 'Status' },
    { key: 'rating', label: 'Rating', className: 'text-right' },
] as const;

function formatDate(value: Date | null | undefined): string {
    if (!value) { return '—'; }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return '—'; }
    return formatHumanDate(date);
}

function formatRating(rating: number | null | undefined): string {
    if (rating === null || rating === undefined) { return '—'; }
    return `${String(rating)}/5`;
}

function getRatingColor(rating: number | null | undefined): string {
    if (rating === null || rating === undefined) { return ''; }
    if (rating >= 4) { return 'text-green-600'; }
    if (rating >= 3) { return 'text-yellow-600'; }
    return 'text-red-600';
}

export async function PerformanceReviewsPanel({
    authorization,
    userId,
    title,
    description,
}: PerformanceReviewsPanelProps) {
    const result = await getPerformanceReviewsForUi({
        authorization,
        userId,
    });

    const reviews = result.reviews;
    const resolvedTitle = title ?? 'Performance Reviews';
    const resolvedDescription = description ?? 'Your performance evaluation history.';

    return (
        <HrDataTable
            title={resolvedTitle}
            description={resolvedDescription}
            columns={COLUMNS}
            isEmpty={reviews.length === 0}
            emptyMessage="No performance reviews found."
        >
            {reviews.map((review) => (
                <TableRow key={review.id}>
                    <TableCell className="font-medium">
                        {formatDate(review.periodStartDate)} – {formatDate(review.periodEndDate)}
                    </TableCell>
                    <TableCell>{formatDate(review.scheduledDate)}</TableCell>
                    <TableCell>
                        <HrStatusBadge status={review.status} />
                    </TableCell>
                    <TableCell className={`text-right ${getRatingColor(review.overallRating)}`}>
                        {review.status === 'completed' ? (
                            <Badge variant={review.overallRating && review.overallRating >= 4 ? 'default' : 'outline'}>
                                {formatRating(review.overallRating)}
                            </Badge>
                        ) : (
                            '—'
                        )}
                    </TableCell>
                </TableRow>
            ))}
        </HrDataTable>
    );
}
