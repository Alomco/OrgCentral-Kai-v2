import { Skeleton } from '@/components/ui/skeleton';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';

export default function AbsencesLoading() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-5 w-48" />

            {/* Page header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Content grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <HrCardSkeleton variant="form" />
                <HrCardSkeleton variant="table" />
            </div>
        </div>
    );
}
