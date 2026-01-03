'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { LeavePolicy } from '@/server/types/leave-types';

import { updateEligibilityAction } from '../lifecycle-actions';

export interface EmployeeLifecycleEligibilityCardProps {
    profileId: string;
    eligibleLeaveTypes: string[];
    leavePolicies: LeavePolicy[];
    defaultYear: number;
}

export function EmployeeLifecycleEligibilityCard({
    profileId,
    eligibleLeaveTypes,
    leavePolicies,
    defaultYear,
}: EmployeeLifecycleEligibilityCardProps) {
    const [state, formAction, pending] = useActionState(updateEligibilityAction, { status: 'idle' });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leave eligibility</CardTitle>
                <CardDescription>Assign eligible leave types and refresh balances.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="profileId" value={profileId} />
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="eligibility-year">
                            Balance year
                        </label>
                        <Input
                            id="eligibility-year"
                            name="year"
                            type="number"
                            min={2000}
                            max={2100}
                            defaultValue={defaultYear}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Eligible leave types</div>
                        {leavePolicies.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No leave policies available yet.
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {leavePolicies.map((policy) => (
                                    <label
                                        key={policy.id}
                                        className="flex items-start gap-2 rounded-md border border-border/60 p-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            name="eligibleLeaveTypes"
                                            value={policy.policyType}
                                            defaultChecked={eligibleLeaveTypes.includes(policy.policyType)}
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="font-medium">{policy.name}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {policy.policyType.replace(/_/g, ' ').toLowerCase()}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" size="sm" disabled={pending}>
                            {pending ? 'Updating...' : 'Update eligibility'}
                        </Button>
                        <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                            {state.status === 'error'
                                ? state.message ?? 'Unable to update eligibility.'
                                : state.status === 'success'
                                    ? state.message ?? 'Eligibility updated.'
                                    : 'Changes apply immediately.'}
                        </span>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
