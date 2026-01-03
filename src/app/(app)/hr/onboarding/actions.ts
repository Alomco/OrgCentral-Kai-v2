'use server';

import {
    inviteEmployeeAction as inviteEmployeeActionImpl,
} from './actions/invite-employee';
import {
    revokeOnboardingInvitationAction as revokeOnboardingInvitationActionImpl,
} from './actions/onboarding-invitations';
import {
    createChecklistTemplateAction as createChecklistTemplateActionImpl,
} from './actions/checklist-templates.create';
import {
    deleteChecklistTemplateAction as deleteChecklistTemplateActionImpl,
} from './actions/checklist-templates.delete';
import {
    updateChecklistTemplateAction as updateChecklistTemplateActionImpl,
} from './actions/checklist-templates.update';
import {
    toggleChecklistItemAction as toggleChecklistItemActionImpl,
    completeChecklistAction as completeChecklistActionImpl,
} from './actions/checklist-instance';
import {
    submitOnboardingWizardAction as submitOnboardingWizardActionImpl,
    checkEmailExistsAction as checkEmailExistsActionImpl,
} from './wizard/wizard.actions';

export async function inviteEmployeeAction(
    ...args: Parameters<typeof inviteEmployeeActionImpl>
): Promise<Awaited<ReturnType<typeof inviteEmployeeActionImpl>>> {
    return inviteEmployeeActionImpl(...args);
}

export async function revokeOnboardingInvitationAction(
    ...args: Parameters<typeof revokeOnboardingInvitationActionImpl>
): Promise<Awaited<ReturnType<typeof revokeOnboardingInvitationActionImpl>>> {
    return revokeOnboardingInvitationActionImpl(...args);
}

export async function createChecklistTemplateAction(
    ...args: Parameters<typeof createChecklistTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof createChecklistTemplateActionImpl>>> {
    return createChecklistTemplateActionImpl(...args);
}

export async function deleteChecklistTemplateAction(
    ...args: Parameters<typeof deleteChecklistTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof deleteChecklistTemplateActionImpl>>> {
    return deleteChecklistTemplateActionImpl(...args);
}

export async function updateChecklistTemplateAction(
    ...args: Parameters<typeof updateChecklistTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof updateChecklistTemplateActionImpl>>> {
    return updateChecklistTemplateActionImpl(...args);
}

export async function toggleChecklistItemAction(
    ...args: Parameters<typeof toggleChecklistItemActionImpl>
): Promise<Awaited<ReturnType<typeof toggleChecklistItemActionImpl>>> {
    return toggleChecklistItemActionImpl(...args);
}

export async function completeChecklistAction(
    ...args: Parameters<typeof completeChecklistActionImpl>
): Promise<Awaited<ReturnType<typeof completeChecklistActionImpl>>> {
    return completeChecklistActionImpl(...args);
}

export async function submitOnboardingWizardAction(
    ...args: Parameters<typeof submitOnboardingWizardActionImpl>
): Promise<Awaited<ReturnType<typeof submitOnboardingWizardActionImpl>>> {
    return submitOnboardingWizardActionImpl(...args);
}

export async function checkEmailExistsAction(
    ...args: Parameters<typeof checkEmailExistsActionImpl>
): Promise<Awaited<ReturnType<typeof checkEmailExistsActionImpl>>> {
    return checkEmailExistsActionImpl(...args);
}
