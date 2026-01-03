import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistInstance } from '@/server/types/onboarding-types';

export interface GetActiveChecklistInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
}

export interface GetActiveChecklistDependencies {
    checklistInstanceRepository: IChecklistInstanceRepository;
}

export interface GetActiveChecklistResult {
    instance: ChecklistInstance | null;
}

export async function getActiveChecklistForEmployee(
    deps: GetActiveChecklistDependencies,
    input: GetActiveChecklistInput,
): Promise<GetActiveChecklistResult> {
    const instance = await deps.checklistInstanceRepository.getActiveInstanceForEmployee(
        input.authorization.orgId,
        input.employeeId,
    );

    return { instance };
}
