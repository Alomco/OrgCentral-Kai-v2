'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OnboardingWizardValues } from './wizard.schema';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { LeaveType } from './assignments-step';
import { ReviewAssignmentsSection, ReviewIdentitySection, ReviewJobSection } from './review-sections';
import type { WizardStepId } from './onboarding-wizard-steps';

export interface ReviewStepProps {
    values: OnboardingWizardValues;
    checklistTemplates?: ChecklistTemplate[];
    workflowTemplates?: OnboardingWorkflowTemplateRecord[];
    emailSequenceTemplates?: EmailSequenceTemplateRecord[];
    documentTemplates?: DocumentTemplateRecord[];
    leaveTypes?: LeaveType[];
    onEditStep?: (stepIndex: number) => void;
    stepIndexById: Map<string, number>;
}

export function ReviewStep({
    values,
    checklistTemplates = [],
    workflowTemplates = [],
    emailSequenceTemplates = [],
    documentTemplates = [],
    leaveTypes = [],
    onEditStep,
    stepIndexById,
}: ReviewStepProps) {
    const selectedTemplate = checklistTemplates.find((t) => t.id === values.onboardingTemplateId);
    const selectedWorkflow = workflowTemplates.find((t) => t.id === values.workflowTemplateId);
    const selectedEmailSequence = emailSequenceTemplates.find(
        (t) => t.id === values.emailSequenceTemplateId,
    );
    const selectedDocuments = documentTemplates.filter((document_) =>
        (values.documentTemplateIds ?? []).includes(document_.id),
    );
    const selectedLeaveTypes = values.eligibleLeaveTypes ?? [];
    const getStepIndex = (id: WizardStepId) => stepIndexById.get(id);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Review &amp; Send</h3>
                <p className="text-sm text-muted-foreground">
                    Review the invitation details before sending access to the invitee.
                </p>
            </div>

            <div className="grid gap-4">
                <ReviewIdentitySection
                    values={values}
                    onEditStep={onEditStep}
                    stepIndex={getStepIndex('identity')}
                    showEmployeeFields={values.useOnboarding}
                />
                {values.useOnboarding ? (
                    <ReviewJobSection
                        values={values}
                        onEditStep={onEditStep}
                        stepIndex={getStepIndex('job')}
                    />
                ) : null}
                {values.useOnboarding ? (
                    <ReviewAssignmentsSection
                        values={values}
                        leaveTypes={leaveTypes}
                        selectedLeaveTypes={selectedLeaveTypes}
                        selectedTemplate={selectedTemplate}
                        selectedWorkflow={selectedWorkflow}
                        selectedEmailSequence={selectedEmailSequence}
                        selectedDocuments={selectedDocuments}
                        onEditStep={onEditStep}
                        stepIndex={getStepIndex('assignments')}
                    />
                ) : null}
            </div>

            {/* Summary */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">What happens next?</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>- An invitation email will be sent to <strong>{values.email}</strong></li>
                        <li>- The invitee will create an account and accept the invitation</li>
                        <li>- Access will be granted with the <strong>{values.role}</strong> role</li>
                        {values.useOnboarding ? (
                            <li>- An employee profile will be created with the supplied onboarding details</li>
                        ) : null}
                        {values.useOnboarding && values.includeTemplate && selectedTemplate ? (
                            <li>- The onboarding checklist will be assigned automatically</li>
                        ) : null}
                        {values.useOnboarding && selectedWorkflow ? (
                            <li>- The onboarding workflow will start using the selected template</li>
                        ) : null}
                        {values.useOnboarding && selectedEmailSequence ? (
                            <li>- Automated onboarding emails will be scheduled</li>
                        ) : null}
                        {values.useOnboarding && selectedDocuments.length > 0 ? (
                            <li>- Required onboarding documents will be assigned</li>
                        ) : null}
                        {values.useOnboarding && (values.provisioningTaskTypes?.length ?? 0) > 0 ? (
                            <li>- IT provisioning tasks will be created for the employee</li>
                        ) : null}
                        {values.useOnboarding && selectedLeaveTypes.length > 0 ? (
                            <li>- Leave balances will be initialized for the assigned leave types</li>
                        ) : null}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
