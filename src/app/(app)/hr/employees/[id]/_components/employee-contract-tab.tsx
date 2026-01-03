import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { PrismaEmploymentContractRepository } from '@/server/repositories/prisma/hr/people';
import { listEmploymentContractsByEmployee } from '@/server/use-cases/hr/people/employment/list-employment-contracts-by-employee';

import { buildInitialEmployeeContractFormState } from '../../form-state';
import { EmployeeContractEditCard } from './employee-contract-edit-card';
import { EmployeeContractSummaryCard } from './employee-contract-summary-card';
import { EmployeeContractHistoryCard } from './employee-contract-history-card';

export interface EmployeeContractTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export async function EmployeeContractTab({ authorization, profile }: EmployeeContractTabProps) {
    const contractRepository = new PrismaEmploymentContractRepository();
    const { contracts } = await listEmploymentContractsByEmployee(
        { employmentContractRepository: contractRepository },
        { authorization, employeeId: profile.userId },
    );

    const currentContract = contracts[0] ?? null;
    const formState = buildInitialEmployeeContractFormState(profile, currentContract);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <EmployeeContractSummaryCard contract={currentContract} />
                <EmployeeContractEditCard initialState={formState} />
            </div>
            <EmployeeContractHistoryCard contracts={contracts} />
        </div>
    );
}
