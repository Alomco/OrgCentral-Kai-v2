import { Skeleton } from '@/components/ui/skeleton';

import { HrPageHeader } from '../_components/hr-page-header';

export default function HrOnboardingLoading() {
    return (
        <div className="space-y-6">
            <HrPageHeader title="Onboarding" description="Loading onboarding…" />

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
}
