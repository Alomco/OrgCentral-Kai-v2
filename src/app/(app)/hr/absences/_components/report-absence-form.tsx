'use client';

import { useActionState, useId, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { reportAbsenceAction } from '../actions';
import type { ReportAbsenceFormState } from '../form-state';
import { FieldError } from '../../_components/field-error';

export interface AbsenceTypeOption {
    id: string;
    label: string;
}

export interface ReportAbsenceFormProps {
    authorization: RepositoryAuthorizationContext;
    initialState: ReportAbsenceFormState;
    absenceTypes: AbsenceTypeOption[];
}

export function ReportAbsenceForm({ authorization, initialState, absenceTypes }: ReportAbsenceFormProps) {
    const formId = useId();
    const formReference = useRef<HTMLFormElement>(null);
    const boundAction = reportAbsenceAction.bind(null, authorization);
    const [state, formAction, isPending] = useActionState(boundAction, initialState);

    const isSuccess = state.status === 'success';
    const isError = state.status === 'error';
    const hasAbsenceTypes = absenceTypes.length > 0;

    // Show toast on successful submission
    useEffect(() => {
        if (isSuccess) {
            toast.success('Absence reported successfully!', {
                description: 'Your absence has been recorded and is pending approval.',
            });
            formReference.current?.reset();
        }
    }, [isSuccess]);

    return (
        <Card className="border-2 border-transparent transition-colors hover:border-primary/10 motion-reduce:transition-none">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Report Absence
                </CardTitle>
                <CardDescription>Report an unplanned absence such as sick leave.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formReference} action={formAction} className="space-y-4">
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-type`}>Type</Label>
                            <Select
                                name="typeId"
                                defaultValue={state.values.typeId}
                                disabled={!hasAbsenceTypes || isPending}
                            >
                                <SelectTrigger id={`${formId}-type`}>
                                    <SelectValue placeholder={hasAbsenceTypes ? 'Select type' : 'No types configured'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {absenceTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={state.fieldErrors?.typeId} />
                            {!hasAbsenceTypes ? (
                                <p className="text-xs text-muted-foreground">
                                    No absence types are configured. Ask an HR admin to add absence types in HR Settings.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-hours`}>Hours</Label>
                            <Input
                                id={`${formId}-hours`}
                                name="hours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="24"
                                defaultValue={state.values.hours}
                            />
                            <FieldError message={state.fieldErrors?.hours} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-start`}>Start Date</Label>
                            <Input
                                id={`${formId}-start`}
                                name="startDate"
                                type="date"
                                defaultValue={state.values.startDate}
                            />
                            <FieldError message={state.fieldErrors?.startDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-end`}>End Date</Label>
                            <Input
                                id={`${formId}-end`}
                                name="endDate"
                                type="date"
                                defaultValue={state.values.endDate}
                            />
                            <FieldError message={state.fieldErrors?.endDate} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-reason`}>Reason (optional)</Label>
                        <Textarea
                            id={`${formId}-reason`}
                            name="reason"
                            rows={3}
                            placeholder="Brief description of absence..."
                            defaultValue={state.values.reason}
                        />
                    </div>

                    <Button type="submit" disabled={isPending || !hasAbsenceTypes} className="w-full sm:w-auto">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Reporting...
                            </>
                        ) : (
                            'Report Absence'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
