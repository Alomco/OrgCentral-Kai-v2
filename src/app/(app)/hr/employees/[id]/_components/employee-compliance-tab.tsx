import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

import { ComplianceItemsPanel } from '@/app/(app)/hr/compliance/_components/compliance-items-panel';
import { formatEmployeeName } from '../../_components/employee-formatters';

export interface EmployeeComplianceTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export function EmployeeComplianceTab({ authorization, profile }: EmployeeComplianceTabProps) {
    return (
        <ComplianceItemsPanel
            authorization={authorization}
            userId={profile.userId}
            title="Compliance items"
            description={`Compliance items assigned to ${formatEmployeeName(profile)}.`}
        />
    );
}
