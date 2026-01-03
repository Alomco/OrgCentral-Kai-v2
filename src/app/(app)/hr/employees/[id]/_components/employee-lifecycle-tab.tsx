import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { PrismaLeavePolicyRepository } from '@/server/repositories/prisma/hr/leave';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { PrismaEmploymentContractRepository } from '@/server/repositories/prisma/hr/people';
import { listLeavePolicies } from '@/server/use-cases/hr/leave-policies/list-leave-policies';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';
import { listEmploymentContractsByEmployee } from '@/server/use-cases/hr/people/employment/list-employment-contracts-by-employee';

import { EmployeeLifecycleEligibilityCard } from './employee-lifecycle-eligibility-card';
import { EmployeeLifecycleTerminationCard } from './employee-lifecycle-termination-card';
import { EmployeeLifecycleComplianceCard } from './employee-lifecycle-compliance-card';

export interface EmployeeLifecycleTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export async function EmployeeLifecycleTab({ authorization, profile }: EmployeeLifecycleTabProps) {
    const leavePolicyRepository = new PrismaLeavePolicyRepository();
    const complianceTemplateRepository = new PrismaComplianceTemplateRepository();
    const contractRepository = new PrismaEmploymentContractRepository();

    const [policyResult, templates, contractResult] = await Promise.all([
        listLeavePolicies(
            { leavePolicyRepository },
            { authorization, payload: { orgId: authorization.orgId } },
        ),
        listComplianceTemplates(
            { complianceTemplateRepository },
            { authorization },
        ),
        listEmploymentContractsByEmployee(
            { employmentContractRepository: contractRepository },
            { authorization, employeeId: profile.userId },
        ),
    ]);

    const defaultYear = new Date().getFullYear();

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <EmployeeLifecycleEligibilityCard
                    profileId={profile.id}
                    eligibleLeaveTypes={profile.eligibleLeaveTypes ?? []}
                    leavePolicies={policyResult.policies}
                    defaultYear={defaultYear}
                />
                <EmployeeLifecycleTerminationCard
                    profileId={profile.id}
                    contracts={contractResult.contracts}
                />
            </div>
            <EmployeeLifecycleComplianceCard
                profileId={profile.id}
                userId={profile.userId}
                templates={templates}
            />
        </div>
    );
}
