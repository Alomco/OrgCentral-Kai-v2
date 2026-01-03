import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

import { PerformanceReviewsPanel } from '@/app/(app)/hr/performance/_components/performance-reviews-panel';
import { TrainingRecordsPanel } from '@/app/(app)/hr/training/_components/training-records-panel';

export interface EmployeeDevelopmentTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export function EmployeeDevelopmentTab({ authorization, profile }: EmployeeDevelopmentTabProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <PerformanceReviewsPanel
                authorization={authorization}
                userId={profile.userId}
                title="Performance summary"
                description="Recent reviews and rating history for this employee."
            />
            <TrainingRecordsPanel
                authorization={authorization}
                userId={profile.userId}
                title="Training summary"
                description="Training courses and certifications on record."
            />
        </div>
    );
}
