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

export interface LeaveType {
    code: string;
    name: string;
    description?: string;
}

// Default UK leave types that are commonly used
const DEFAULT_LEAVE_TYPES: LeaveType[] = [
    { code: 'ANNUAL', name: 'Annual Leave', description: 'Statutory paid annual leave' },
    { code: 'SICK', name: 'Sick Leave', description: 'Paid sick leave' },
    { code: 'MATERNITY', name: 'Maternity Leave', description: 'Statutory maternity leave' },
    { code: 'PATERNITY', name: 'Paternity Leave', description: 'Statutory paternity leave' },
    { code: 'UNPAID', name: 'Unpaid Leave', description: 'Unpaid time off' },
    { code: 'EMERGENCY', name: 'Emergency Leave', description: 'Emergency time off for urgent matters' },
];

export interface AssignmentsStepProps {
    values: OnboardingWizardValues;
    fieldErrors?: FieldErrors<OnboardingWizardValues>;
    onValuesChange: (updates: Partial<OnboardingWizardValues>) => void;
    leaveTypes?: LeaveType[];
    checklistTemplates?: ChecklistTemplate[];
    canManageTemplates?: boolean;
    disabled?: boolean;
}

export function AssignmentsStep({
    values,
    fieldErrors,
    onValuesChange,
    leaveTypes = DEFAULT_LEAVE_TYPES,
    checklistTemplates = [],
    canManageTemplates = false,
    disabled = false,
}: AssignmentsStepProps) {
    const leaveTypesError = fieldErrors?.eligibleLeaveTypes;
    const templateError = fieldErrors?.onboardingTemplateId;

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
    const allSelected = selectedLeaveTypes.length === leaveTypes.length;

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
                                disabled={disabled || allSelected}
                                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                Select all
                            </button>
                            <span className="text-xs text-muted-foreground">·</span>
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
        </div>
    );
}
