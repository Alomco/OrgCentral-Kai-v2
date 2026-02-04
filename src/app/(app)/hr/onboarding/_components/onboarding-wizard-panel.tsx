'use client';

import { useRouter } from 'next/navigation';

import { OnboardingWizard, type OnboardingWizardValues } from '../wizard';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { Department } from '../wizard/job-step';
import type { InviteRoleOption, ManagerOption } from '../wizard/wizard.types';
import type { LeaveType } from '../wizard/assignments-step';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import { submitOnboardingWizardAction, checkEmailExistsAction } from '../actions';

export interface OnboardingWizardPanelProps {
    roleOptions: InviteRoleOption[];
    defaultRole?: string;
    canManageOnboarding?: boolean;
    cancelPath?: string;
    departments?: Department[];
    checklistTemplates?: ChecklistTemplate[];
    workflowTemplates?: OnboardingWorkflowTemplateRecord[];
    emailSequenceTemplates?: EmailSequenceTemplateRecord[];
    documentTemplates?: DocumentTemplateRecord[];
    provisioningTaskOptions?: { value: string; label: string }[];
    managers?: ManagerOption[];
    leaveTypes?: LeaveType[];
    canManageTemplates?: boolean;
    enableEmailCheck?: boolean;
}

export function OnboardingWizardPanel({
    roleOptions,
    defaultRole,
    canManageOnboarding = false,
    cancelPath,
    departments = [],
    checklistTemplates = [],
    workflowTemplates = [],
    emailSequenceTemplates = [],
    documentTemplates = [],
    provisioningTaskOptions = [],
    managers = [],
    leaveTypes = [],
    canManageTemplates = false,
    enableEmailCheck = false,
}: OnboardingWizardPanelProps) {
    const router = useRouter();

    const handleSubmit = async (values: OnboardingWizardValues) => {
        return submitOnboardingWizardAction(values);
    };

    const handleEmailCheck = enableEmailCheck
        ? async (email: string) => checkEmailExistsAction(email)
        : undefined;

    const handleCancel = cancelPath
        ? () => {
            router.push(cancelPath);
        }
        : undefined;

    return (
        <OnboardingWizard
            roleOptions={roleOptions}
            defaultRole={defaultRole}
            departments={departments}
            checklistTemplates={checklistTemplates}
            workflowTemplates={workflowTemplates}
            emailSequenceTemplates={emailSequenceTemplates}
            documentTemplates={documentTemplates}
            provisioningTaskOptions={provisioningTaskOptions}
            managers={managers}
            leaveTypes={leaveTypes}
            canManageTemplates={canManageTemplates}
            canManageOnboarding={canManageOnboarding}
            onEmailCheck={handleEmailCheck}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    );
}
