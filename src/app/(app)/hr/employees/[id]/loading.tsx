import { Skeleton } from '@/components/ui/skeleton';

import { HrCardSkeleton } from '../../_components/hr-card-skeleton';
import { HrPageHeader } from '../../_components/hr-page-header';

export default function EmployeeDetailLoading() {
    return (
        <div className="space-y-6">
            <HrPageHeader title="Employee" description="Loading employee profile..." />
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-24" />
                ))}
            </div>
            <HrCardSkeleton variant="table" />
        </div>
    );
}
