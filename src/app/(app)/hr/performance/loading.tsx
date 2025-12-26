import { Skeleton } from '@/components/ui/skeleton';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';

export default function PerformanceLoading() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-5 w-48" />

            {/* Page header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Stats card skeleton */}
            <HrCardSkeleton variant="list" />

            {/* Reviews table skeleton */}
            <HrCardSkeleton variant="table" />
        </div>
    );
}
