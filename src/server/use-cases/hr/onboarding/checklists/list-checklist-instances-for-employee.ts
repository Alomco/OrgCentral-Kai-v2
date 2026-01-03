import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { ChecklistInstance } from '@/server/types/onboarding-types';
import { assertOnboardingReader } from '@/server/security/authorization/hr-guards/onboarding';

export interface ListChecklistInstancesInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
}

export interface ListChecklistInstancesDependencies {
    checklistInstanceRepository: IChecklistInstanceRepository;
}

export interface ListChecklistInstancesResult {
    instances: ChecklistInstance[];
}

export async function listChecklistInstancesForEmployee(
    deps: ListChecklistInstancesDependencies,
    input: ListChecklistInstancesInput,
): Promise<ListChecklistInstancesResult> {
    await assertOnboardingReader({
        authorization: input.authorization,
        resourceAttributes: {
            orgId: input.authorization.orgId,
            employeeId: input.employeeId,
        },
    });

    const instances = await deps.checklistInstanceRepository.listInstancesForEmployee(
        input.authorization.orgId,
        input.employeeId,
    );

    const sorted = [...instances].sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );

    return { instances: sorted };
}
