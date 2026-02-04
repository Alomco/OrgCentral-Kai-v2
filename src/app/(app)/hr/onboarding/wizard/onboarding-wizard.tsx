'use client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import { type Department } from './job-step';
import { type LeaveType } from './assignments-step';
import { OnboardingWizardContent } from './onboarding-wizard-content';
import { OnboardingWizardFooter } from './onboarding-wizard-footer';
import { OnboardingWizardSuccess } from './onboarding-wizard-success';
import type { OnboardingWizardValues } from './wizard.schema';
import { useOnboardingWizard } from './onboarding-wizard.hook';
import type { EmailCheckResult, InviteRoleOption, ManagerOption, WizardSubmitResult } from './wizard.types';

const ROLE_OPTIONS_FALLBACK: InviteRoleOption[] = [{ name: 'member', description: 'Standard employee access.' }];
export interface OnboardingWizardProps {
    /** Initial form values */
    initialValues?: Partial<OnboardingWizardValues>;
    /** Allowed roles for the invite */
    roleOptions?: InviteRoleOption[];
    /** Default role selection */
    defaultRole?: string;
    /** Available departments */
    departments?: Department[];
    /** Available managers */
    managers?: ManagerOption[];
    /** Available leave types */
    leaveTypes?: LeaveType[];
    /** Available checklist templates */
    checklistTemplates?: ChecklistTemplate[];
    /** Available workflow templates */
    workflowTemplates?: OnboardingWorkflowTemplateRecord[];
    /** Available email sequences */
    emailSequenceTemplates?: EmailSequenceTemplateRecord[];
    /** Available document templates */
    documentTemplates?: DocumentTemplateRecord[];
    /** Provisioning task options */
    provisioningTaskOptions?: { value: string; label: string }[];
    /** Whether the user can manage templates */
    canManageTemplates?: boolean;
    /** Whether onboarding details can be used */
    canManageOnboarding?: boolean;
    /** Email existence check function */
    onEmailCheck?: (email: string) => Promise<EmailCheckResult>;
    /** Submit handler */
    onSubmit: (values: OnboardingWizardValues) => Promise<WizardSubmitResult>;
    /** Cancel handler */
    onCancel?: () => void;
}

export function OnboardingWizard({
    initialValues,
    roleOptions = ROLE_OPTIONS_FALLBACK,
    defaultRole,
    departments = [],
    managers = [],
    leaveTypes,
    checklistTemplates = [],
    workflowTemplates = [],
    emailSequenceTemplates = [],
    documentTemplates = [],
    provisioningTaskOptions = [],
    canManageTemplates = false,
    canManageOnboarding = false,
    onEmailCheck,
    onSubmit,
    onCancel,
}: OnboardingWizardProps) {
    const resolvedRoleOptions = roleOptions.length > 0 ? roleOptions : ROLE_OPTIONS_FALLBACK;
    const {
        state,
        steps,
        stepper,
        currentStepId,
        isSubmitting,
        isSuccess,
        handleValuesChange,
        handleNext,
        handlePrevious,
        handleGoToStep,
        handleSubmit,
    } = useOnboardingWizard({
        initialValues,
        roleOptions: resolvedRoleOptions,
        defaultRole,
        canManageOnboarding,
        leaveTypes,
        onSubmit,
    });
    const heading = state.values.useOnboarding ? 'Onboard New Employee' : 'Invite User';

    // Success state
    if (isSuccess) {
        return (
            <OnboardingWizardSuccess
                email={state.values.email}
                role={state.values.role}
                token={state.token}
                invitationUrl={state.invitationUrl}
                emailDelivered={state.emailDelivered}
                message={state.message}
                onCancel={onCancel}
            />
        );
    }

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{heading}</h2>
                    {onCancel && (
                        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Stepper
                    steps={steps}
                    currentStep={stepper.currentStep}
                    onStepClick={handleGoToStep}
                />
            </CardHeader>

            <OnboardingWizardContent
                currentStepId={currentStepId}
                steps={steps}
                state={state}
                departments={departments}
                managers={managers}
                leaveTypes={leaveTypes}
                checklistTemplates={checklistTemplates}
                workflowTemplates={workflowTemplates}
                emailSequenceTemplates={emailSequenceTemplates}
                documentTemplates={documentTemplates}
                provisioningTaskOptions={provisioningTaskOptions}
                canManageTemplates={canManageTemplates && state.values.useOnboarding}
                roleOptions={resolvedRoleOptions}
                onValuesChange={handleValuesChange}
                onEmailCheck={onEmailCheck}
                onEditStep={handleGoToStep}
                isSubmitting={isSubmitting}
            />

            <OnboardingWizardFooter
                isSubmitting={isSubmitting}
                isFirstStep={stepper.isFirstStep}
                isLastStep={stepper.isLastStep}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
            />
        </Card>
    );
}
