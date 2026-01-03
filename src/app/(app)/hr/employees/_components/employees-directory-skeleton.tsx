import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { HrCardSkeleton } from '../../_components/hr-card-skeleton';

export function EmployeesDirectorySkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="mt-2 h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <HrCardSkeleton variant="table" />
        </div>
    );
}
