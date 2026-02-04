'use client';
import { useMemo } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardContent } from '@/components/ui/card';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';

import { IdentityStep } from './identity-step';
import { JobStep, type Department } from './job-step';
import { AssignmentsStep, type LeaveType } from './assignments-step';
import { ReviewStep } from './review-step';
import type { OnboardingWizardState } from './wizard.state';
import type { OnboardingWizardValues } from './wizard.schema';
import type { EmailCheckResult, InviteRoleOption, ManagerOption } from './wizard.types';
import type { StepperStep } from '@/components/ui/stepper';
import type { WizardStepId } from './onboarding-wizard-steps';

export interface OnboardingWizardContentProps {
    currentStepId: WizardStepId;
    steps: StepperStep[];
    state: OnboardingWizardState;
    departments: Department[];
    managers: ManagerOption[];
    leaveTypes?: LeaveType[];
    checklistTemplates: ChecklistTemplate[];
    workflowTemplates: OnboardingWorkflowTemplateRecord[];
    emailSequenceTemplates: EmailSequenceTemplateRecord[];
    documentTemplates: DocumentTemplateRecord[];
    provisioningTaskOptions: { value: string; label: string }[];
    canManageTemplates: boolean;
    roleOptions: InviteRoleOption[];
    onValuesChange: (updates: Partial<OnboardingWizardValues>) => void;
    onEmailCheck?: (email: string) => Promise<EmailCheckResult>;
    onEditStep: (stepIndex: number) => void;
    isSubmitting: boolean;
}

export function OnboardingWizardContent({
    currentStepId,
    steps,
    state,
    departments,
    managers,
    leaveTypes,
    checklistTemplates,
    workflowTemplates,
    emailSequenceTemplates,
    documentTemplates,
    provisioningTaskOptions,
    canManageTemplates,
    roleOptions,
    onValuesChange,
    onEmailCheck,
    onEditStep,
    isSubmitting,
}: OnboardingWizardContentProps) {
    const stepIndexById = useMemo(
        () => new Map(steps.map((step, index) => [step.id, index])),
        [steps],
    );

    return (
        <CardContent className="min-h-[400px]">
            {state.status === 'error' && state.message && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

            {currentStepId === 'identity' && (
                <IdentityStep
                    values={state.values}
                    fieldErrors={state.fieldErrors}
                    onValuesChange={onValuesChange}
                    onEmailCheck={onEmailCheck}
                    disabled={isSubmitting}
                    roleOptions={roleOptions}
                />
            )}

            {currentStepId === 'job' && (
                <JobStep
                    values={state.values}
                    fieldErrors={state.fieldErrors}
                    onValuesChange={onValuesChange}
                    departments={departments}
                    managers={managers}
                    disabled={isSubmitting}
                />
            )}

            {currentStepId === 'assignments' && (
                <AssignmentsStep
                    values={state.values}
                    fieldErrors={state.fieldErrors}
                    onValuesChange={onValuesChange}
                    leaveTypes={leaveTypes}
                    checklistTemplates={checklistTemplates}
                    workflowTemplates={workflowTemplates}
                    emailSequenceTemplates={emailSequenceTemplates}
                    documentTemplates={documentTemplates}
                    provisioningTaskOptions={provisioningTaskOptions}
                    canManageTemplates={canManageTemplates}
                    disabled={isSubmitting}
                />
            )}

            {currentStepId === 'review' && (
                <ReviewStep
                    values={state.values}
                    checklistTemplates={checklistTemplates}
                    workflowTemplates={workflowTemplates}
                    emailSequenceTemplates={emailSequenceTemplates}
                    documentTemplates={documentTemplates}
                    leaveTypes={leaveTypes}
                    onEditStep={onEditStep}
                    stepIndexById={stepIndexById}
                />
            )}
        </CardContent>
    );
}
