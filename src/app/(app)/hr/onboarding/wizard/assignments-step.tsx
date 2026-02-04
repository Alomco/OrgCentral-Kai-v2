'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { FieldError } from '../../_components/field-error';
import type { OnboardingWizardValues } from './wizard.schema';
import type { FieldErrors } from '../../_components/form-errors';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { LeaveTypeOption } from '@/server/types/hr/leave-type-options';

export type LeaveType = LeaveTypeOption;

export interface AssignmentsStepProps {
    values: OnboardingWizardValues;
    fieldErrors?: FieldErrors<OnboardingWizardValues>;
    onValuesChange: (updates: Partial<OnboardingWizardValues>) => void;
    leaveTypes?: LeaveType[];
    checklistTemplates?: ChecklistTemplate[];
    workflowTemplates?: OnboardingWorkflowTemplateRecord[];
    emailSequenceTemplates?: EmailSequenceTemplateRecord[];
    documentTemplates?: DocumentTemplateRecord[];
    provisioningTaskOptions?: { value: string; label: string }[];
    canManageTemplates?: boolean;
    disabled?: boolean;
}

export function AssignmentsStep({
    values,
    fieldErrors,
    onValuesChange,
    leaveTypes = [],
    checklistTemplates = [],
    workflowTemplates = [],
    emailSequenceTemplates = [],
    documentTemplates = [],
    provisioningTaskOptions = [],
    canManageTemplates = false,
    disabled = false,
}: AssignmentsStepProps) {
    const leaveTypesError = fieldErrors?.eligibleLeaveTypes;
    const templateError = fieldErrors?.onboardingTemplateId;
    const workflowTemplateError = fieldErrors?.workflowTemplateId;
    const emailSequenceError = fieldErrors?.emailSequenceTemplateId;
    const documentTemplateError = fieldErrors?.documentTemplateIds;

    const handleLeaveTypeToggle = (code: string, checked: boolean) => {
        const currentTypes = values.eligibleLeaveTypes ?? [];
        const updatedTypes = checked
            ? [...currentTypes, code]
            : currentTypes.filter((t) => t !== code);
        onValuesChange({ eligibleLeaveTypes: updatedTypes });
    };

    const handleSelectAllLeaveTypes = () => {
        const allCodes = leaveTypes.map((t) => t.code);
        onValuesChange({ eligibleLeaveTypes: allCodes });
    };

    const handleClearAllLeaveTypes = () => {
        onValuesChange({ eligibleLeaveTypes: [] });
    };

    const selectedLeaveTypes = values.eligibleLeaveTypes ?? [];
    const allSelected = leaveTypes.length > 0 && selectedLeaveTypes.length === leaveTypes.length;
    const selectedDocuments = values.documentTemplateIds ?? [];
    const selectedProvisioningTasks = values.provisioningTaskTypes ?? [];

    const handleDocumentToggle = (templateId: string, checked: boolean) => {
        const updated = checked
            ? [...selectedDocuments, templateId]
            : selectedDocuments.filter((id) => id !== templateId);
        onValuesChange({ documentTemplateIds: updated });
    };

    const handleProvisioningToggle = (taskType: string, checked: boolean) => {
        const updated = checked
            ? [...selectedProvisioningTasks, taskType]
            : selectedProvisioningTasks.filter((value) => value !== taskType);
        onValuesChange({ provisioningTaskTypes: updated });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Assignments</h3>
                <p className="text-sm text-muted-foreground">
                    Configure which leave types the employee is eligible for and assign an onboarding checklist.
                </p>
            </div>

            {/* Leave Types */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Leave Types</CardTitle>
                            <CardDescription>
                                Select the leave types this employee will be eligible for.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllLeaveTypes}
                                disabled={disabled || allSelected || leaveTypes.length === 0}
                                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                Select all
                            </button>
                            <span className="text-xs text-muted-foreground">|</span>
                            <button
                                type="button"
                                onClick={handleClearAllLeaveTypes}
                                disabled={disabled || selectedLeaveTypes.length === 0}
                                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {leaveTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No leave types are configured for this organization yet.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {leaveTypes.map((leaveType) => {
                                const isChecked = selectedLeaveTypes.includes(leaveType.code);
                                return (
                                    <div
                                        key={leaveType.code}
                                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            id={`leave-${leaveType.code}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                handleLeaveTypeToggle(leaveType.code, checked === true)
                                            }
                                            disabled={disabled}
                                        />
                                        <div className="grid gap-0.5">
                                            <Label
                                                htmlFor={`leave-${leaveType.code}`}
                                                className="cursor-pointer font-medium"
                                            >
                                                {leaveType.name}
                                            </Label>
                                            {leaveType.description ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {leaveType.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <FieldError id="wizard-leaveTypes-error" message={leaveTypesError} />
                    {selectedLeaveTypes.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            {selectedLeaveTypes.length} leave type{selectedLeaveTypes.length !== 1 ? 's' : ''} selected
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Onboarding Checklist */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Onboarding Checklist</CardTitle>
                    <CardDescription>
                        Optionally attach a checklist template to guide the employee through onboarding tasks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-sm font-medium">Attach checklist template</div>
                            <div className="text-xs text-muted-foreground">
                                {canManageTemplates
                                    ? 'The employee will see checklist items upon joining.'
                                    : 'You do not have permission to manage templates.'}
                            </div>
                        </div>
                        <Switch
                            checked={values.includeTemplate ?? false}
                            onCheckedChange={(checked) => onValuesChange({ includeTemplate: checked })}
                            disabled={disabled}
                            aria-label="Attach checklist template"
                        />
                    </div>

                    {values.includeTemplate && (
                        <div className="space-y-2">
                            <Label htmlFor="wizard-onboardingTemplateId">Template</Label>
                            <Select
                                value={values.onboardingTemplateId ?? ''}
                                onValueChange={(value) => onValuesChange({ onboardingTemplateId: value || undefined })}
                                disabled={disabled || !canManageTemplates || checklistTemplates.length === 0}
                            >
                                <SelectTrigger
                                    id="wizard-onboardingTemplateId"
                                    aria-invalid={Boolean(templateError)}
                                    aria-describedby={templateError ? 'wizard-onboardingTemplateId-error' : undefined}
                                >
                                    <SelectValue
                                        placeholder={
                                            checklistTemplates.length === 0
                                                ? 'No templates available'
                                                : 'Select a template'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {checklistTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            <div className="flex flex-col">
                                                <span>{template.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError id="wizard-onboardingTemplateId-error" message={templateError} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Workflow Template */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Workflow Template</CardTitle>
                    <CardDescription>
                        Choose a workflow template to customize the onboarding stages and approvals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label htmlFor="wizard-workflowTemplateId">Template</Label>
                    <Select
                        value={values.workflowTemplateId ?? ''}
                        onValueChange={(value) => onValuesChange({ workflowTemplateId: value || undefined })}
                        disabled={disabled || workflowTemplates.length === 0}
                    >
                        <SelectTrigger
                            id="wizard-workflowTemplateId"
                            aria-invalid={Boolean(workflowTemplateError)}
                            aria-describedby={workflowTemplateError ? 'wizard-workflowTemplateId-error' : undefined}
                        >
                            <SelectValue
                                placeholder={workflowTemplates.length === 0 ? 'No templates available' : 'Select a template'}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {workflowTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                    <div className="flex flex-col">
                                        <span>{template.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {template.templateType} • v{template.version}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError id="wizard-workflowTemplateId-error" message={workflowTemplateError} />
                </CardContent>
            </Card>

            {/* Email Sequence */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Email Sequence</CardTitle>
                    <CardDescription>
                        Select an automated email sequence to guide the employee during onboarding.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label htmlFor="wizard-emailSequenceTemplateId">Sequence</Label>
                    <Select
                        value={values.emailSequenceTemplateId ?? ''}
                        onValueChange={(value) => onValuesChange({ emailSequenceTemplateId: value || undefined })}
                        disabled={disabled || emailSequenceTemplates.length === 0}
                    >
                        <SelectTrigger
                            id="wizard-emailSequenceTemplateId"
                            aria-invalid={Boolean(emailSequenceError)}
                            aria-describedby={emailSequenceError ? 'wizard-emailSequenceTemplateId-error' : undefined}
                        >
                            <SelectValue
                                placeholder={emailSequenceTemplates.length === 0 ? 'No sequences available' : 'Select a sequence'}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {emailSequenceTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                    <div className="flex flex-col">
                                        <span>{template.name}</span>
                                        <span className="text-xs text-muted-foreground">{template.trigger}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError id="wizard-emailSequenceTemplateId-error" message={emailSequenceError} />
                </CardContent>
            </Card>

            {/* Document Templates */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Required Documents</CardTitle>
                    <CardDescription>
                        Select document templates that must be completed during onboarding.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documentTemplates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No document templates are configured yet.</p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {documentTemplates.map((template) => {
                                const isChecked = selectedDocuments.includes(template.id);
                                return (
                                    <div
                                        key={template.id}
                                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            id={`doc-${template.id}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                handleDocumentToggle(template.id, checked === true)}
                                            disabled={disabled}
                                        />
                                        <div className="grid gap-0.5">
                                            <Label htmlFor={`doc-${template.id}`} className="cursor-pointer font-medium">
                                                {template.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">{template.type}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <FieldError id="wizard-documentTemplateIds-error" message={documentTemplateError} />
                </CardContent>
            </Card>

            {/* Provisioning Tasks */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">IT Provisioning</CardTitle>
                    <CardDescription>
                        Select the provisioning tasks required for the employee.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {provisioningTaskOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No provisioning tasks configured.</p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {provisioningTaskOptions.map((option) => {
                                const isChecked = selectedProvisioningTasks.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            id={`task-${option.value}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                handleProvisioningToggle(option.value, checked === true)}
                                            disabled={disabled}
                                        />
                                        <Label htmlFor={`task-${option.value}`} className="cursor-pointer font-medium">
                                            {option.label}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
