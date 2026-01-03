'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Briefcase, ListChecks, PlaneTakeoff } from 'lucide-react';

import type { OnboardingWizardValues } from './wizard.schema';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    TEMPORARY: 'Temporary',
    INTERN: 'Intern',
};

const PAY_SCHEDULE_LABELS: Record<string, string> = {
    MONTHLY: 'Monthly',
    WEEKLY: 'Weekly',
    BIWEEKLY: 'Bi-weekly',
    ANNUAL: 'Annual',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
    ANNUAL: 'Annual Leave',
    SICK: 'Sick Leave',
    MATERNITY: 'Maternity Leave',
    PATERNITY: 'Paternity Leave',
    ADOPTION: 'Adoption Leave',
    UNPAID: 'Unpaid Leave',
    SPECIAL: 'Special Leave',
    EMERGENCY: 'Emergency Leave',
};

export interface ReviewStepProps {
    values: OnboardingWizardValues;
    checklistTemplates?: ChecklistTemplate[];
    onEditStep?: (stepIndex: number) => void;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateString: string | undefined): string {
    if (!dateString) {return '—';}
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

interface ReviewSectionProps {
    title: string;
    icon: React.ReactNode;
    stepIndex: number;
    onEdit?: (stepIndex: number) => void;
    children: React.ReactNode;
}

function ReviewSection({ title, icon, stepIndex, onEdit, children }: ReviewSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(stepIndex)}
                            className="text-xs text-primary hover:underline"
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
        <div className="flex justify-between py-1.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value ?? '—'}</span>
        </div>
    );
}

export function ReviewStep({ values, checklistTemplates = [], onEditStep }: ReviewStepProps) {
    const selectedTemplate = checklistTemplates.find((t) => t.id === values.onboardingTemplateId);
    const selectedLeaveTypes = values.eligibleLeaveTypes ?? [];

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Review &amp; Send</h3>
                <p className="text-sm text-muted-foreground">
                    Review the onboarding details before sending the invitation to the employee.
                </p>
            </div>

            <div className="grid gap-4">
                {/* Identity */}
                <ReviewSection
                    title="Employee Identity"
                    icon={<User className="h-4 w-4 text-muted-foreground" />}
                    stepIndex={0}
                    onEdit={onEditStep}
                >
                    <div className="space-y-0.5">
                        <ReviewField label="Email" value={values.email} />
                        <Separator />
                        <ReviewField label="Display name" value={values.displayName} />
                        <Separator />
                        <ReviewField label="Employee number" value={values.employeeNumber} />
                    </div>
                </ReviewSection>

                {/* Job & Compensation */}
                <ReviewSection
                    title="Job & Compensation"
                    icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                    stepIndex={1}
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
                            label="Annual salary"
                            value={
                                values.annualSalary
                                    ? formatCurrency(values.annualSalary, values.currency)
                                    : undefined
                            }
                        />
                        <Separator />
                        <ReviewField
                            label="Pay schedule"
                            value={values.paySchedule ? PAY_SCHEDULE_LABELS[values.paySchedule] : undefined}
                        />
                    </div>
                </ReviewSection>

                {/* Assignments */}
                <ReviewSection
                    title="Assignments"
                    icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
                    stepIndex={2}
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
                                            {LEAVE_TYPE_LABELS[code] ?? code}
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
            </div>

            {/* Summary */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">What happens next?</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>• An invitation email will be sent to <strong>{values.email}</strong></li>
                        <li>• The employee will create an account and accept the invitation</li>
                        <li>• Their profile will be set up with the configured details</li>
                        {values.includeTemplate && selectedTemplate && (
                            <li>• The onboarding checklist will be assigned automatically</li>
                        )}
                        {selectedLeaveTypes.length > 0 && (
                            <li>• Leave balances will be initialized for the assigned leave types</li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
