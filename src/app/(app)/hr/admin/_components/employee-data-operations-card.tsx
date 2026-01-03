'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
    runRetentionSweepAction,
    scheduleRetentionSweepAction,
} from '../actions/data-retention.actions';

export function EmployeeDataOperationsCard() {
    const [runState, runAction, runPending] = useActionState(runRetentionSweepAction, { status: 'idle' });
    const [scheduleState, scheduleAction, schedulePending] = useActionState(
        scheduleRetentionSweepAction,
        { status: 'idle' },
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data retention & SAR</CardTitle>
                <CardDescription>Export SAR data and manage retention sweeps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <section className="space-y-3">
                    <div className="text-sm font-semibold">Subject access request export</div>
                    <form action="/hr/admin/people-sar-export" method="get" className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="sar-format">
                                Format
                            </label>
                            <select
                                id="sar-format"
                                name="format"
                                defaultValue="csv"
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="csv">CSV</option>
                                <option value="jsonl">JSONL</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground sm:pt-6">
                            <input type="checkbox" name="includeProfiles" defaultChecked className="h-4 w-4" />
                            Profiles
                        </label>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground sm:pt-6">
                            <input type="checkbox" name="includeContracts" defaultChecked className="h-4 w-4" />
                            Contracts
                        </label>
                        <div className="sm:col-span-3">
                            <Button type="submit" size="sm">
                                Download SAR export
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="space-y-3">
                    <div className="text-sm font-semibold">Retention sweeps</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <form action={runAction} className="space-y-2">
                            <Button type="submit" size="sm" disabled={runPending}>
                                {runPending ? 'Running...' : 'Run sweep now'}
                            </Button>
                            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                                {runState.status === 'error'
                                    ? runState.message ?? 'Unable to run sweep.'
                                    : runState.status === 'success'
                                        ? runState.message ?? 'Retention sweep complete.'
                                        : 'Runs once for expired records.'}
                            </p>
                        </form>
                        <form action={scheduleAction} className="space-y-2">
                            <Button type="submit" size="sm" variant="outline" disabled={schedulePending}>
                                {schedulePending ? 'Scheduling...' : 'Schedule nightly sweep'}
                            </Button>
                            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                                {scheduleState.status === 'error'
                                    ? scheduleState.message ?? 'Unable to schedule.'
                                    : scheduleState.status === 'success'
                                        ? scheduleState.message ?? 'Nightly sweep scheduled.'
                                        : 'Defaults to 02:00 UTC nightly.'}
                            </p>
                        </form>
                    </div>
                </section>
            </CardContent>
        </Card>
    );
}
