import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

import type { EmployeeDetailTabId } from './employee-detail-tabs';
import { EmployeeOverviewTab } from './employee-overview-tab';
import { EmployeeComplianceTab } from './employee-compliance-tab';
import { EmployeeTimeOffTab } from './employee-timeoff-tab';
import { EmployeeChecklistsTab } from './employee-checklists-tab';
import { EmployeeContractTab } from './employee-contract-tab';
import { EmployeeDevelopmentTab } from './employee-development-tab';
import { EmployeeLifecycleTab } from './employee-lifecycle-tab';

export interface EmployeeDetailContentProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
    tab: EmployeeDetailTabId;
}

export function EmployeeDetailContent({ authorization, profile, tab }: EmployeeDetailContentProps) {
    switch (tab) {
        case 'compliance':
            return (
                <EmployeeComplianceTab authorization={authorization} profile={profile} />
            );
        case 'time-off':
            return (
                <EmployeeTimeOffTab authorization={authorization} profile={profile} />
            );
        case 'checklists':
            return (
                <EmployeeChecklistsTab authorization={authorization} profile={profile} />
            );
        case 'contract':
            return (
                <EmployeeContractTab authorization={authorization} profile={profile} />
            );
        case 'lifecycle':
            return (
                <EmployeeLifecycleTab authorization={authorization} profile={profile} />
            );
        case 'development':
            return (
                <EmployeeDevelopmentTab authorization={authorization} profile={profile} />
            );
        case 'overview':
        default:
            return (
                <EmployeeOverviewTab authorization={authorization} profile={profile} />
            );
    }
}
