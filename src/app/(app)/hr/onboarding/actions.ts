'use server';

import {
    inviteEmployeeAction as inviteEmployeeActionImpl,
} from './actions/invite-employee';
import {
    revokeOnboardingInvitationAction as revokeOnboardingInvitationActionImpl,
    resendOnboardingInvitationAction as resendOnboardingInvitationActionImpl,
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
} from './wizard/wizard.actions';
import {
    checkEmailExistsAction as checkEmailExistsActionImpl,
} from './wizard/wizard.email.actions';
import {
    createWorkflowTemplateAction as createWorkflowTemplateActionImpl,
} from './actions/workflow-templates.create';
import {
    updateWorkflowTemplateAction as updateWorkflowTemplateActionImpl,
} from './actions/workflow-templates.update';
import {
    deleteWorkflowTemplateAction as deleteWorkflowTemplateActionImpl,
} from './actions/workflow-templates.delete';
import {
    createEmailSequenceTemplateAction as createEmailSequenceTemplateActionImpl,
} from './actions/email-sequences.create';
import {
    updateEmailSequenceTemplateAction as updateEmailSequenceTemplateActionImpl,
} from './actions/email-sequences.update';
import {
    deleteEmailSequenceTemplateAction as deleteEmailSequenceTemplateActionImpl,
} from './actions/email-sequences.delete';
import {
    createDocumentTemplateAction as createDocumentTemplateActionImpl,
} from './actions/document-templates.create';
import {
    updateDocumentTemplateAction as updateDocumentTemplateActionImpl,
} from './actions/document-templates.update';
import {
    deleteDocumentTemplateAction as deleteDocumentTemplateActionImpl,
} from './actions/document-templates.delete';
import {
    createMetricDefinitionAction as createMetricDefinitionActionImpl,
} from './actions/metrics.create';
import {
    updateMetricDefinitionAction as updateMetricDefinitionActionImpl,
} from './actions/metrics.update';
import {
    deleteMetricDefinitionAction as deleteMetricDefinitionActionImpl,
} from './actions/metrics.delete';
import {
    createOnboardingFeedbackAction as createOnboardingFeedbackActionImpl,
} from './actions/feedback.create';

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

export async function resendOnboardingInvitationAction(
    ...args: Parameters<typeof resendOnboardingInvitationActionImpl>
): Promise<Awaited<ReturnType<typeof resendOnboardingInvitationActionImpl>>> {
    return resendOnboardingInvitationActionImpl(...args);
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

export async function createWorkflowTemplateAction(
    ...args: Parameters<typeof createWorkflowTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof createWorkflowTemplateActionImpl>>> {
    return createWorkflowTemplateActionImpl(...args);
}

export async function updateWorkflowTemplateAction(
    ...args: Parameters<typeof updateWorkflowTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof updateWorkflowTemplateActionImpl>>> {
    return updateWorkflowTemplateActionImpl(...args);
}

export async function deleteWorkflowTemplateAction(
    ...args: Parameters<typeof deleteWorkflowTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof deleteWorkflowTemplateActionImpl>>> {
    return deleteWorkflowTemplateActionImpl(...args);
}

export async function createEmailSequenceTemplateAction(
    ...args: Parameters<typeof createEmailSequenceTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof createEmailSequenceTemplateActionImpl>>> {
    return createEmailSequenceTemplateActionImpl(...args);
}

export async function updateEmailSequenceTemplateAction(
    ...args: Parameters<typeof updateEmailSequenceTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof updateEmailSequenceTemplateActionImpl>>> {
    return updateEmailSequenceTemplateActionImpl(...args);
}

export async function deleteEmailSequenceTemplateAction(
    ...args: Parameters<typeof deleteEmailSequenceTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof deleteEmailSequenceTemplateActionImpl>>> {
    return deleteEmailSequenceTemplateActionImpl(...args);
}

export async function createDocumentTemplateAction(
    ...args: Parameters<typeof createDocumentTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof createDocumentTemplateActionImpl>>> {
    return createDocumentTemplateActionImpl(...args);
}

export async function updateDocumentTemplateAction(
    ...args: Parameters<typeof updateDocumentTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof updateDocumentTemplateActionImpl>>> {
    return updateDocumentTemplateActionImpl(...args);
}

export async function deleteDocumentTemplateAction(
    ...args: Parameters<typeof deleteDocumentTemplateActionImpl>
): Promise<Awaited<ReturnType<typeof deleteDocumentTemplateActionImpl>>> {
    return deleteDocumentTemplateActionImpl(...args);
}

export async function createMetricDefinitionAction(
    ...args: Parameters<typeof createMetricDefinitionActionImpl>
): Promise<Awaited<ReturnType<typeof createMetricDefinitionActionImpl>>> {
    return createMetricDefinitionActionImpl(...args);
}

export async function updateMetricDefinitionAction(
    ...args: Parameters<typeof updateMetricDefinitionActionImpl>
): Promise<Awaited<ReturnType<typeof updateMetricDefinitionActionImpl>>> {
    return updateMetricDefinitionActionImpl(...args);
}

export async function deleteMetricDefinitionAction(
    ...args: Parameters<typeof deleteMetricDefinitionActionImpl>
): Promise<Awaited<ReturnType<typeof deleteMetricDefinitionActionImpl>>> {
    return deleteMetricDefinitionActionImpl(...args);
}

export async function createOnboardingFeedbackAction(
    ...args: Parameters<typeof createOnboardingFeedbackActionImpl>
): Promise<Awaited<ReturnType<typeof createOnboardingFeedbackActionImpl>>> {
    return createOnboardingFeedbackActionImpl(...args);
}
