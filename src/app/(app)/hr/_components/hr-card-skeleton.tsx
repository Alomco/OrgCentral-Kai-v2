import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface HrCardSkeletonProps {
    variant?: 'form' | 'table' | 'list';
}

/** Skeleton loading states for HR module cards. Server Component. */
export function HrCardSkeleton({ variant = 'form' }: HrCardSkeletonProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-40" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                {variant === 'form' ? <FormSkeleton /> : null}
                {variant === 'table' ? <TableSkeleton /> : null}
                {variant === 'list' ? <ListSkeleton /> : null}
            </CardContent>
        </Card>
    );
}

function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-28" />
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}
