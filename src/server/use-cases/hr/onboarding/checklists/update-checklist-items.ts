import { EntityNotFoundError } from '@/server/errors';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistInstance, ChecklistItemProgress } from '@/server/types/onboarding-types';

export interface UpdateChecklistItemsInput {
    authorization: RepositoryAuthorizationContext;
    instanceId: string;
    items: ChecklistItemProgress[];
}

export interface UpdateChecklistItemsDependencies {
    checklistInstanceRepository: IChecklistInstanceRepository;
}

export interface UpdateChecklistItemsResult {
    instance: ChecklistInstance;
}

export async function updateChecklistItems(
    deps: UpdateChecklistItemsDependencies,
    input: UpdateChecklistItemsInput,
): Promise<UpdateChecklistItemsResult> {
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
        throw new Error(`Cannot update items on a ${existing.status.toLowerCase()} checklist.`);
    }

    const instance = await deps.checklistInstanceRepository.updateItems(
        input.authorization.orgId,
        input.instanceId,
        {
            items: input.items,
            metadata: {
                ...((existing.metadata ?? {})),
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: input.authorization.userId,
            },
        },
    );

    return { instance };
}

export interface ToggleChecklistItemInput {
    authorization: RepositoryAuthorizationContext;
    instanceId: string;
    itemIndex: number;
    completed: boolean;
}

export async function toggleChecklistItem(
    deps: UpdateChecklistItemsDependencies,
    input: ToggleChecklistItemInput,
): Promise<UpdateChecklistItemsResult> {
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
        throw new Error(`Cannot update items on a ${existing.status.toLowerCase()} checklist.`);
    }

    if (input.itemIndex < 0 || input.itemIndex >= existing.items.length) {
        throw new Error(`Invalid item index: ${String(input.itemIndex)}`);
    }

    const updatedItems = existing.items.map((item, index) => {
        if (index === input.itemIndex) {
            return {
                ...item,
                completed: input.completed,
                completedAt: input.completed ? new Date() : null,
            };
        }
        return item;
    });

    const instance = await deps.checklistInstanceRepository.updateItems(
        input.authorization.orgId,
        input.instanceId,
        {
            items: updatedItems,
            metadata: {
                ...((existing.metadata ?? {})),
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: input.authorization.userId,
            },
        },
    );

    return { instance };
}
