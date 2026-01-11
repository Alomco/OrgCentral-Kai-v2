'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { EntityNotFoundError } from '@/server/errors';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    toggleChecklistItem,
    completeChecklist,
} from '@/server/use-cases/hr/onboarding/checklists';

const checklistInstanceRepository = new PrismaChecklistInstanceRepository();

const RESOURCE_TYPE = 'hr.onboarding.checklist';

interface ToggleItemResult {
    success: boolean;
    error?: string;
}

export async function toggleChecklistItemAction(
    instanceId: string,
    itemIndex: number,
    completed: boolean,
): Promise<ToggleItemResult> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:hr:onboarding:checklist:toggle',
                resourceType: RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            success: false,
            error: 'Not authorized to update checklist.',
        };
    }

    try {
        await toggleChecklistItem(
            { checklistInstanceRepository },
            {
                authorization: session.authorization,
                instanceId,
                itemIndex,
                completed,
            },
        );

        revalidatePath('/hr/profile');
        revalidatePath('/hr/onboarding');

        return { success: true };
    } catch (error) {
        if (error instanceof EntityNotFoundError) {
            return { success: false, error: 'Checklist not found.' };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update checklist item.',
        };
    }
}

interface CompleteChecklistResult {
    success: boolean;
    error?: string;
}

export async function completeChecklistAction(instanceId: string): Promise<CompleteChecklistResult> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:hr:onboarding:checklist:complete',
                resourceType: RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            success: false,
            error: 'Not authorized to complete checklist.',
        };
    }

    try {
        await completeChecklist(
            { checklistInstanceRepository },
            {
                authorization: session.authorization,
                instanceId,
            },
        );

        revalidatePath('/hr/profile');
        revalidatePath('/hr/onboarding');

        return { success: true };
    } catch (error) {
        if (error instanceof EntityNotFoundError) {
            return { success: false, error: 'Checklist not found.' };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to complete checklist.',
        };
    }
}
