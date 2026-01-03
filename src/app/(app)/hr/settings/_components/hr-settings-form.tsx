'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { FieldError } from '../../_components/field-error';
import { updateHrSettingsAction } from '../actions';
import { buildInitialHrSettingsFormState } from '../form-state';
import type { HrSettingsFormValues } from '../schema';

function readFieldError(fieldErrors: unknown, key: string): string | undefined {
    if (!fieldErrors || typeof fieldErrors !== 'object') {
        return undefined;
    }

    const value = (fieldErrors as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
}

export function HrSettingsForm(props: {
    defaults: HrSettingsFormValues;
}) {
    const initialState = buildInitialHrSettingsFormState(props.defaults);
    const [state, formAction, pending] = useActionState(updateHrSettingsAction, initialState);

    const standardHoursPerDayError = readFieldError(state.fieldErrors, 'standardHoursPerDay');
    const standardDaysPerWeekError = readFieldError(state.fieldErrors, 'standardDaysPerWeek');
    const adminNotesError = readFieldError(state.fieldErrors, 'adminNotes');
    const approvalWorkflowsJsonError = readFieldError(state.fieldErrors, 'approvalWorkflowsJson');

    const enableOvertimeReference = useRef<HTMLInputElement | null>(null);
    const formReference = useRef<HTMLFormElement | null>(null);
    const statusReference = useRef<HTMLParagraphElement | null>(null);
    const previousStatus = useRef(state.status);

    const hoursPerDayErrorId = standardHoursPerDayError ? 'standardHoursPerDay-error' : undefined;
    const daysPerWeekErrorId = standardDaysPerWeekError ? 'standardDaysPerWeek-error' : undefined;
    const adminNotesErrorId = adminNotesError ? 'adminNotes-error' : undefined;
    const workflowsErrorId = approvalWorkflowsJsonError ? 'approvalWorkflowsJson-error' : undefined;

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (!pending && state.status !== 'idle' && previousStatus.current !== state.status) {
            statusReference.current?.focus();
        }

        previousStatus.current = state.status;
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={formAction} aria-busy={pending}>
            <Card>
                <CardHeader>
                    <CardTitle>Working hours</CardTitle>
                    <CardDescription>
                        Standard defaults used for leave, time tracking, and absence calculations.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <fieldset disabled={pending} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="standardHoursPerDay">Hours per day</Label>
                                <Input
                                    id="standardHoursPerDay"
                                    name="standardHoursPerDay"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={24}
                                    step={0.25}
                                    key={`hpd-${String(state.values.standardHoursPerDay)}`}
                                    defaultValue={state.values.standardHoursPerDay}
                                    required
                                    aria-invalid={hoursPerDayErrorId ? 'true' : undefined}
                                    aria-describedby={hoursPerDayErrorId}
                                />
                                <FieldError id={hoursPerDayErrorId} message={standardHoursPerDayError} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="standardDaysPerWeek">Days per week</Label>
                                <Input
                                    id="standardDaysPerWeek"
                                    name="standardDaysPerWeek"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={7}
                                    step={1}
                                    key={`dpw-${String(state.values.standardDaysPerWeek)}`}
                                    defaultValue={state.values.standardDaysPerWeek}
                                    required
                                    aria-invalid={daysPerWeekErrorId ? 'true' : undefined}
                                    aria-describedby={daysPerWeekErrorId}
                                />
                                <FieldError id={daysPerWeekErrorId} message={standardDaysPerWeekError} />
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="enableOvertime">Enable overtime</Label>
                                <p id="enableOvertime-help" className="text-xs text-muted-foreground">
                                    Allows overtime-related policy settings for eligible roles.
                                </p>
                            </div>

                            <input
                                ref={enableOvertimeReference}
                                type="hidden"
                                name="enableOvertime"
                                value={state.values.enableOvertime ? 'on' : 'off'}
                            />
                            <Switch
                                id="enableOvertime"
                                key={state.values.enableOvertime ? 'overtime-on' : 'overtime-off'}
                                defaultChecked={state.values.enableOvertime}
                                onCheckedChange={(checked) => {
                                    if (enableOvertimeReference.current) {
                                        enableOvertimeReference.current.value = checked ? 'on' : 'off';
                                    }
                                }}
                                aria-label="Enable overtime"
                                aria-describedby="enableOvertime-help"
                                disabled={pending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminNotes">Admin notes</Label>
                            <Textarea
                                id="adminNotes"
                                name="adminNotes"
                                placeholder="Internal notes for HR admins (not visible to employees)."
                                key={`notes-${state.values.adminNotes}`}
                                defaultValue={state.values.adminNotes}
                                aria-invalid={adminNotesErrorId ? 'true' : undefined}
                                aria-describedby={adminNotesErrorId}
                            />
                            <FieldError id={adminNotesErrorId} message={adminNotesError} />
                            <p className="text-xs text-muted-foreground">
                                Stored in HR settings metadata.
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="approvalWorkflowsJson">Approval workflows (advanced)</Label>
                            <Textarea
                                id="approvalWorkflowsJson"
                                name="approvalWorkflowsJson"
                                placeholder={`{\n  "leaveRequests": {\n    "requiresManagerApproval": true\n  }\n}`}
                                key={`awf-${state.values.approvalWorkflowsJson}`}
                                defaultValue={state.values.approvalWorkflowsJson}
                                className="font-mono"
                                aria-invalid={workflowsErrorId ? 'true' : undefined}
                                aria-describedby={workflowsErrorId}
                            />
                            <FieldError id={workflowsErrorId} message={approvalWorkflowsJsonError} />
                            <p className="text-xs text-muted-foreground">
                                JSON object stored in HR settings. Empty value resets to an empty object.
                            </p>
                        </div>
                    </fieldset>
                </CardContent>

                <CardFooter className="border-t justify-between gap-4">
                    <p
                        ref={statusReference}
                        tabIndex={-1}
                        className="text-xs text-muted-foreground"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.status === 'success'
                            ? state.message ?? 'Saved'
                            : state.status === 'error'
                                ? state.message ?? 'Unable to save'
                                : 'Changes apply immediately'}
                    </p>

                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Saving…' : 'Save'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
