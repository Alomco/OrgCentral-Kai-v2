'use client';

import { useActionState, useId, useRef } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createTimeEntryAction } from '../actions';
import type { TimeEntryFormState } from '../form-state';
import { FieldError } from '../../_components/field-error';

export interface CreateTimeEntryFormProps {
    initialState: TimeEntryFormState;
}

export function CreateTimeEntryForm({ initialState }: CreateTimeEntryFormProps) {
    const formId = useId();
    const [state, formAction, isPending] = useActionState(createTimeEntryAction, initialState);
    const billableReference = useRef<HTMLInputElement | null>(null);

    const isSuccess = state.status === 'success';
    const isError = state.status === 'error';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Log Time
                </CardTitle>
                <CardDescription>
                    Record your working hours. Leave project fields blank if you are unsure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {isSuccess ? (
                        <Alert className="bg-green-50 dark:bg-green-950/30">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                {state.message}
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    {isError && state.message && !state.fieldErrors ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-date`}>Date</Label>
                            <Input
                                id={`${formId}-date`}
                                name="date"
                                type="date"
                                defaultValue={state.values.date}
                            />
                            <FieldError message={state.fieldErrors?.date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-clockIn`}>Clock In</Label>
                            <Input
                                id={`${formId}-clockIn`}
                                name="clockIn"
                                type="time"
                                defaultValue={state.values.clockIn}
                            />
                            <FieldError message={state.fieldErrors?.clockIn} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-clockOut`}>Clock Out</Label>
                            <Input
                                id={`${formId}-clockOut`}
                                name="clockOut"
                                type="time"
                                defaultValue={state.values.clockOut}
                            />
                            <FieldError message={state.fieldErrors?.clockOut} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-break`}>Break (hours)</Label>
                            <Input
                                id={`${formId}-break`}
                                name="breakDuration"
                                type="number"
                                min="0"
                                step="0.25"
                                defaultValue={state.values.breakDuration}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-project`}>Project (optional)</Label>
                            <Input
                                id={`${formId}-project`}
                                name="project"
                                placeholder="Project name"
                                defaultValue={state.values.project}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-projectCode`}>Project code (optional)</Label>
                            <Input
                                id={`${formId}-projectCode`}
                                name="projectCode"
                                placeholder="Budget or cost center"
                                defaultValue={state.values.projectCode}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                            <div className="space-y-1">
                                <Label htmlFor={`${formId}-billable`}>Billable time</Label>
                                <p id={`${formId}-billable-help`} className="text-xs text-muted-foreground">Marks work that is client billable.</p>
                            </div>
                            <input
                                ref={billableReference}
                                type="hidden"
                                name="billable"
                                value={state.values.billable}
                            />
                            <Switch
                                id={`${formId}-billable`} aria-describedby={`${formId}-billable-help`}
                                defaultChecked={state.values.billable === 'on'}
                                onCheckedChange={(checked) => {
                                    if (billableReference.current) {
                                        billableReference.current.value = checked ? 'on' : 'off';
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-tasks`}>Tasks (optional)</Label>
                        <Textarea
                            id={`${formId}-tasks`}
                            name="tasks"
                            rows={2}
                            placeholder="Design review, API testing, client sync"
                            defaultValue={state.values.tasks}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-overtimeReason`}>Overtime reason (optional)</Label>
                        <Textarea
                            id={`${formId}-overtimeReason`}
                            name="overtimeReason"
                            rows={2}
                            placeholder="Explain overtime if applicable"
                            defaultValue={state.values.overtimeReason}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-notes`}>Notes (optional)</Label>
                        <Textarea
                            id={`${formId}-notes`}
                            name="notes"
                            rows={2}
                            placeholder="What did you work on?"
                            defaultValue={state.values.notes}
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Log Time Entry'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

