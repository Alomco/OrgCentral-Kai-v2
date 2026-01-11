'use client';

import Link from 'next/link';
import { Eye, ExternalLink, Sparkles } from 'lucide-react';
import { useActionState, useOptimistic } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    formatDate,
    formatEmployeeName,
    formatOptionalText,
    formatEmploymentStatus,
    formatEmploymentType,
} from './employee-formatters';
import { quickUpdateEmployeeProfileAction } from '../actions/quick-update-employee-profile';
import {
    EMPLOYEE_QUICK_EDIT_INITIAL_STATE,
    type EmployeeQuickEditState,
} from '../actions/quick-update-employee-profile.state';

import { EMPLOYMENT_STATUS_VALUES, type EmploymentStatusCode, type EmploymentTypeCode } from '@/server/types/hr/people';

export interface EmployeeQuickViewProfile {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    employeeNumber: string | null;
    email: string | null;
    personalEmail: string | null;
    jobTitle: string | null;
    employmentType: EmploymentTypeCode | null;
    employmentStatus: EmploymentStatusCode | null;
    startDate: string | null;
}

export function EmployeeQuickViewSheet({ profile }: { profile: EmployeeQuickViewProfile }) {
    const [optimisticProfile, updateOptimisticProfile] = useOptimistic(
        profile,
        (current, updates: Partial<EmployeeQuickViewProfile>) => ({
            ...current,
            ...updates,
        }),
    );
    const [quickEditState, dispatchQuickEdit, isPending] = useActionState<
        EmployeeQuickEditState,
        FormData
    >(quickUpdateEmployeeProfileAction, EMPLOYEE_QUICK_EDIT_INITIAL_STATE);

    const name = formatEmployeeName(optimisticProfile);
    const email = optimisticProfile.email ?? optimisticProfile.personalEmail;
    const employeeHref = `/hr/employees/${profile.id}`;

    const handleQuickEdit = (formData: FormData) => {
        const nextStatus = toEmploymentStatus(formData.get('employmentStatus'));
        const nextJobTitle = toJobTitle(formData.get('jobTitle'));

        const updates: Partial<EmployeeQuickViewProfile> = {};
        if (nextStatus !== undefined) {
            updates.employmentStatus = nextStatus;
        }
        if (nextJobTitle !== undefined) {
            updates.jobTitle = nextJobTitle;
        }

        if (Object.keys(updates).length > 0) {
            updateOptimisticProfile(updates);
        }

        dispatchQuickEdit(formData);
    };

    const quickEditMessageTone = quickEditState.status === 'success' ? 'text-emerald-600' : 'text-destructive';

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Quick view
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center justify-between gap-2">
                        <span className="truncate">{name}</span>
                        <Badge variant="outline" className="shrink-0">
                            {formatEmploymentStatus(optimisticProfile.employmentStatus)}
                        </Badge>
                    </SheetTitle>
                    <SheetDescription>
                        {formatOptionalText(optimisticProfile.jobTitle)} - {formatEmploymentType(optimisticProfile.employmentType)}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-3 px-4">
                    <div className="rounded-lg border bg-background p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-xs text-muted-foreground">Email</div>
                                <div className="font-medium break-all">{formatOptionalText(email)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Employee #</div>
                                <div className="font-medium">{formatOptionalText(optimisticProfile.employeeNumber)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Start date</div>
                                <div className="font-medium">{formatDate(optimisticProfile.startDate)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                Quick edit
                            </div>
                            <Badge variant="secondary">Optimistic</Badge>
                        </div>

                        <form action={handleQuickEdit} className="mt-3 space-y-3">
                            <input type="hidden" name="profileId" value={profile.id} />

                            <div className="space-y-1.5">
                                <Label htmlFor={`quick-job-title-${profile.id}`}>Job title</Label>
                                <Input
                                    id={`quick-job-title-${profile.id}`}
                                    name="jobTitle"
                                    placeholder="Keep current title"
                                    defaultValue={optimisticProfile.jobTitle ?? ''}
                                />
                                {quickEditState.fieldErrors?.jobTitle ? (
                                    <p className="text-xs text-destructive">{quickEditState.fieldErrors.jobTitle}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`quick-status-${profile.id}`}>Employment status</Label>
                                <select
                                    id={`quick-status-${profile.id}`}
                                    name="employmentStatus"
                                    defaultValue={optimisticProfile.employmentStatus ?? ''}
                                    aria-label="Employment status"
                                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Keep current status</option>
                                    {EMPLOYMENT_STATUS_VALUES.map((status) => (
                                        <option key={status} value={status}>
                                            {formatEmploymentStatus(status)}
                                        </option>
                                    ))}
                                </select>
                                {quickEditState.fieldErrors?.employmentStatus ? (
                                    <p className="text-xs text-destructive">{quickEditState.fieldErrors.employmentStatus}</p>
                                ) : null}
                            </div>

                            {quickEditState.message ? (
                                <p className={`text-xs ${quickEditMessageTone}`}>{quickEditState.message}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Changes save without leaving the directory.
                                </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                    We revalidate the directory and profile instantly.
                                </p>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending ? 'Saving…' : 'Save and stay'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                <SheetFooter>
                    <Button asChild variant="outline">
                        <Link href={employeeHref}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open profile
                        </Link>
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function toEmploymentStatus(value: FormDataEntryValue | null): EmploymentStatusCode | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }

    return (EMPLOYMENT_STATUS_VALUES as readonly string[]).includes(value)
        ? (value as EmploymentStatusCode)
        : undefined;
}

function toJobTitle(value: FormDataEntryValue | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}


