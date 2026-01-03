import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardWidgetSkeleton() {
    return (
        <article className="glass-card-wrapper h-full">
            <Card className="glass-card flex h-full flex-col rounded-lg shadow-lg relative z-20 bg-linear-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900/90 dark:via-blue-950/50 dark:to-purple-950/50 border-none overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-6 relative z-10">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-0 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md" />
                    <div className="mt-auto pt-2">
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </article>
    );
}

