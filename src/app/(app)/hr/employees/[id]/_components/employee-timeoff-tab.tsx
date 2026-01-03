import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

import { AbsenceListPanel } from '@/app/(app)/hr/absences/_components/absences-list-panel';
import { LeaveRequestsPanel } from '@/app/(app)/hr/leave/_components/leave-requests-panel';
import { formatEmployeeName } from '../../_components/employee-formatters';

export interface EmployeeTimeOffTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export function EmployeeTimeOffTab({ authorization, profile }: EmployeeTimeOffTabProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <LeaveRequestsPanel
                authorization={authorization}
                employeeId={profile.employeeNumber}
                title="Leave requests"
                description={`Recent leave requests for ${formatEmployeeName(profile)}.`}
            />
            <AbsenceListPanel
                authorization={authorization}
                userId={profile.userId}
            />
        </div>
    );
}
