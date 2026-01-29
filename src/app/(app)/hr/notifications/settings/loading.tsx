import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationSettingsLoading() {
    return (
        <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>

            <div className="space-y-6">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
        </div>
    );
}
