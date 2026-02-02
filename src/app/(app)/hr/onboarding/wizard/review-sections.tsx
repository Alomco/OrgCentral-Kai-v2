'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Briefcase, ListChecks, PlaneTakeoff } from 'lucide-react';

import type { OnboardingWizardValues } from './wizard.schema';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { LeaveType } from './assignments-step';
import {
    EMPLOYMENT_TYPE_LABELS,
    LEAVE_TYPE_LABELS,
    PAY_SCHEDULE_LABELS,
    SALARY_BASIS_LABELS,
    formatCurrency,
    formatDate,
} from './review-utils';

interface ReviewSectionProps {
    title: string;
    icon: React.ReactNode;
    stepIndex?: number;
    onEdit?: (stepIndex: number) => void;
    children: React.ReactNode;
}

function ReviewSection({ title, icon, stepIndex, onEdit, children }: ReviewSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {icon}
                        <CardTitle className="text-base min-w-0 truncate">{title}</CardTitle>
                    </div>
                    {onEdit && stepIndex !== undefined && (
                        <button
                            type="button"
                            onClick={() => onEdit(stepIndex)}
                            className="shrink-0 text-xs text-primary hover:underline"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function ReviewField({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 py-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium break-words sm:max-w-[60%] sm:text-right">
                {value ?? 'N/A'}
            </span>
        </div>
    );
}

export interface ReviewIdentitySectionProps {
    values: OnboardingWizardValues;
    onEditStep?: (stepIndex: number) => void;
    stepIndex?: number;
    showEmployeeFields?: boolean;
}

export function ReviewIdentitySection({
    values,
    onEditStep,
    stepIndex,
    showEmployeeFields = false,
}: ReviewIdentitySectionProps) {
    return (
        <ReviewSection
            title="Access & Identity"
            icon={<User className="h-4 w-4 text-muted-foreground" />}
            stepIndex={stepIndex}
            onEdit={onEditStep}
        >
            <div className="space-y-0.5">
                <ReviewField label="Role" value={values.role} />
                <Separator />
                <ReviewField label="Email" value={values.email} />
                <Separator />
                <ReviewField label="Display name" value={values.displayName} />
                {showEmployeeFields ? (
                    <>
                        <Separator />
                        <ReviewField label="First name" value={values.firstName} />
                        <Separator />
                        <ReviewField label="Last name" value={values.lastName} />
                        <Separator />
                        <ReviewField label="Employee number" value={values.employeeNumber} />
                    </>
                ) : null}
            </div>
        </ReviewSection>
    );
}

export interface ReviewJobSectionProps {
    values: OnboardingWizardValues;
    onEditStep?: (stepIndex: number) => void;
    stepIndex?: number;
}

export function ReviewJobSection({ values, onEditStep, stepIndex }: ReviewJobSectionProps) {
    return (
        <ReviewSection
            title="Job & Compensation"
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
            stepIndex={stepIndex}
            onEdit={onEditStep}
        >
            <div className="space-y-0.5">
                <ReviewField label="Job title" value={values.jobTitle} />
                <Separator />
                <ReviewField
                    label="Employment type"
                    value={values.employmentType ? EMPLOYMENT_TYPE_LABELS[values.employmentType] : undefined}
                />
                <Separator />
                <ReviewField label="Start date" value={formatDate(values.startDate)} />
                <Separator />
                <ReviewField label="Manager" value={values.managerEmployeeNumber} />
                <Separator />
                <ReviewField
                    label="Pay basis"
                    value={values.salaryBasis ? SALARY_BASIS_LABELS[values.salaryBasis] : undefined}
                />
                <Separator />
                <ReviewField
                    label="Annual salary"
                    value={values.annualSalary ? formatCurrency(values.annualSalary, values.currency) : undefined}
                />
                <Separator />
                <ReviewField
                    label="Hourly rate"
                    value={values.hourlyRate ? formatCurrency(values.hourlyRate, values.currency) : undefined}
                />
                <Separator />
                <ReviewField
                    label="Pay schedule"
                    value={values.paySchedule ? PAY_SCHEDULE_LABELS[values.paySchedule] : undefined}
                />
            </div>
        </ReviewSection>
    );
}

export interface ReviewAssignmentsSectionProps {
    values: OnboardingWizardValues;
    leaveTypes: LeaveType[];
    selectedLeaveTypes: string[];
    selectedTemplate?: ChecklistTemplate;
    onEditStep?: (stepIndex: number) => void;
    stepIndex?: number;
}

export function ReviewAssignmentsSection({
    values,
    leaveTypes,
    selectedLeaveTypes,
    selectedTemplate,
    onEditStep,
    stepIndex,
}: ReviewAssignmentsSectionProps) {
    const leaveTypeLabelMap = new Map(leaveTypes.map((leaveType) => [leaveType.code, leaveType.name]));

    return (
        <ReviewSection
            title="Assignments"
            icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
            stepIndex={stepIndex}
            onEdit={onEditStep}
        >
            <div className="space-y-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <PlaneTakeoff className="h-3.5 w-3.5" />
                        Leave Types
                    </div>
                    {selectedLeaveTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedLeaveTypes.map((code) => (
                                <Badge key={code} variant="secondary">
                                    {leaveTypeLabelMap.get(code) ?? LEAVE_TYPE_LABELS[code] ?? code}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No leave types assigned</p>
                    )}
                </div>

                <Separator />

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" />
                        Onboarding Checklist
                    </div>
                    {values.includeTemplate && selectedTemplate ? (
                        <div>
                            <p className="text-sm font-medium">{selectedTemplate.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedTemplate.items.length} item{selectedTemplate.items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No checklist assigned</p>
                    )}
                </div>
            </div>
        </ReviewSection>
    );
}
