import { EntityNotFoundError } from '@/server/errors';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistInstance } from '@/server/types/onboarding-types';

export interface CompleteChecklistInput {
    authorization: RepositoryAuthorizationContext;
    instanceId: string;
}

export interface CompleteChecklistDependencies {
    checklistInstanceRepository: IChecklistInstanceRepository;
}

export interface CompleteChecklistResult {
    instance: ChecklistInstance;
}

export async function completeChecklist(
    deps: CompleteChecklistDependencies,
    input: CompleteChecklistInput,
): Promise<CompleteChecklistResult> {
    const existing = await deps.checklistInstanceRepository.getInstance(
        input.authorization.orgId,
        input.instanceId,
    );

    if (!existing) {
        throw new EntityNotFoundError('Checklist instance', {
            instanceId: input.instanceId,
            orgId: input.authorization.orgId,
        });
    }

    if (existing.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot complete a ${existing.status.toLowerCase()} checklist.`);
    }

    // Check if all items are completed
    const incompleteItems = existing.items.filter((item) => !item.completed);
    if (incompleteItems.length > 0) {
        throw new Error(
            `Cannot complete checklist with ${String(incompleteItems.length)} incomplete item(s). Please complete all items first.`,
        );
    }

    const instance = await deps.checklistInstanceRepository.completeInstance(
        input.authorization.orgId,
        input.instanceId,
    );

    return { instance };
}

export interface CancelChecklistInput {
    authorization: RepositoryAuthorizationContext;
    instanceId: string;
}

export async function cancelChecklist(
    deps: CompleteChecklistDependencies,
    input: CancelChecklistInput,
): Promise<void> {
    const existing = await deps.checklistInstanceRepository.getInstance(
        input.authorization.orgId,
        input.instanceId,
    );

    if (!existing) {
        throw new EntityNotFoundError('Checklist instance', {
            instanceId: input.instanceId,
            orgId: input.authorization.orgId,
        });
    }

    if (existing.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot cancel a ${existing.status.toLowerCase()} checklist.`);
    }

    await deps.checklistInstanceRepository.cancelInstance(
        input.authorization.orgId,
        input.instanceId,
    );
}
