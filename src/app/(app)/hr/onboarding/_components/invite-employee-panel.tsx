import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import { getChecklistTemplatesForUi } from '@/server/use-cases/hr/onboarding/templates/get-checklist-templates.cached';

import { buildInitialOnboardingInviteFormState } from '../form-state';
import { InviteEmployeeForm } from './invite-employee-form';

export interface InviteEmployeePanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function InviteEmployeePanel({ authorization }: InviteEmployeePanelProps) {
    const templatesResult = await getChecklistTemplatesForUi({ authorization });

    const templates: ChecklistTemplate[] = templatesResult.templates;

    const initialState = buildInitialOnboardingInviteFormState({
        email: '',
        displayName: '',
        employeeNumber: '',
        jobTitle: '',
        onboardingTemplateId: undefined,
        includeTemplate: false,
    });

    return (
        <InviteEmployeeForm
            initialState={initialState}
            templates={templates}
            canManageTemplates={templatesResult.canManageTemplates}
        />
    );
}
