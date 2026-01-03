'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { EmploymentContract } from '@/server/types/hr-types';

import { terminateEmployeeAction } from '../lifecycle-actions';
import { formatDate, formatOptionalText } from '../../_components/employee-formatters';

export interface EmployeeLifecycleTerminationCardProps {
    profileId: string;
    contracts: EmploymentContract[];
}

export function EmployeeLifecycleTerminationCard({
    profileId,
    contracts,
}: EmployeeLifecycleTerminationCardProps) {
    const [state, formAction, pending] = useActionState(terminateEmployeeAction, { status: 'idle' });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Termination & offboarding</CardTitle>
                <CardDescription>Record termination details and optional cleanup steps.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="profileId" value={profileId} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="termination-date">
                                Termination date
                            </label>
                            <Input
                                id="termination-date"
                                name="terminationDate"
                                type="date"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="termination-contract">
                                Contract to update
                            </label>
                            <select
                                id="termination-contract"
                                name="contractId"
                                defaultValue={contracts[0]?.id ?? ''}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">No contract update</option>
                                {contracts.map((contract) => (
                                    <option key={contract.id} value={contract.id}>
                                        {formatOptionalText(contract.jobTitle)} - {formatDate(contract.startDate)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="termination-reason">
                            Termination reason
                        </label>
                        <Textarea
                            id="termination-reason"
                            name="terminationReason"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input type="checkbox" name="cancelPendingLeave" className="h-4 w-4" />
                            Cancel pending leave requests
                        </label>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input type="checkbox" name="closeAbsences" className="h-4 w-4" />
                            Close open absences
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" size="sm" disabled={pending}>
                            {pending ? 'Saving...' : 'Record termination'}
                        </Button>
                        <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                            {state.status === 'error'
                                ? state.message ?? 'Unable to save termination.'
                                : state.status === 'success'
                                    ? state.message ?? 'Termination recorded.'
                                    : 'Changes apply immediately.'}
                        </span>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
