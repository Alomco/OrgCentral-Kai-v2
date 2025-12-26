'use client';

import { useActionState, useId } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { createTimeEntryAction } from '../actions';
import type { TimeEntryFormState } from '../form-state';
import { FieldError } from '../../_components/field-error';

export interface CreateTimeEntryFormProps {
    authorization: RepositoryAuthorizationContext;
    initialState: TimeEntryFormState;
}

export function CreateTimeEntryForm({ authorization, initialState }: CreateTimeEntryFormProps) {
    const formId = useId();
    const boundAction = createTimeEntryAction.bind(null, authorization);
    const [state, formAction, isPending] = useActionState(boundAction, initialState);

    const isSuccess = state.status === 'success';
    const isError = state.status === 'error';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Log Time
                </CardTitle>
                <CardDescription>Record your working hours for today.</CardDescription>
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
                            <Label htmlFor={`${formId}-break`}>Break (minutes)</Label>
                            <Input
                                id={`${formId}-break`}
                                name="breakDuration"
                                type="number"
                                min="0"
                                step="5"
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
