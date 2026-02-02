'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { FieldError } from '../../_components/field-error';
import { buildInitialAbsenceSettingsFormState } from '../absence-settings-form-state';
import { updateAbsenceSettingsAction } from '../absence-settings.actions';
import type { AbsenceSettingsFormValues } from '../absence-settings-schema';

function readFieldError(fieldErrors: unknown, key: string): string | undefined {
    if (!fieldErrors || typeof fieldErrors !== 'object') {
        return undefined;
    }

    const value = (fieldErrors as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
}

export function AbsenceSettingsForm(props: { defaults: AbsenceSettingsFormValues }) {
    const initialState = buildInitialAbsenceSettingsFormState(props.defaults);
    const [state, formAction, pending] = useActionState(updateAbsenceSettingsAction, initialState);

    const hoursError = readFieldError(state.fieldErrors, 'hoursInWorkDay');
    const roundingError = readFieldError(state.fieldErrors, 'roundingRule');

    const formReference = useRef<HTMLFormElement | null>(null);
    const statusReference = useRef<HTMLParagraphElement | null>(null);
    const previousStatus = useRef(state.status);

    const hoursErrorId = hoursError ? 'absence-hours-error' : undefined;
    const roundingErrorId = roundingError ? 'absence-rounding-error' : undefined;

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (!pending && state.status !== 'idle' && previousStatus.current !== state.status) {
            statusReference.current?.focus();
        }
        previousStatus.current = state.status;
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Absence settings</CardTitle>
                    <CardDescription>
                        Configure workday hours and rounding for absence calculations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <fieldset disabled={pending} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="absence-hours">Hours in work day</Label>
                                <Input
                                    id="absence-hours"
                                    name="hoursInWorkDay"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={24}
                                    step={0.25}
                                    key={`absence-hours-${String(state.values.hoursInWorkDay)}`}
                                    defaultValue={state.values.hoursInWorkDay}
                                    required
                                    aria-invalid={hoursErrorId ? 'true' : undefined}
                                    aria-describedby={hoursErrorId}
                                />
                                <FieldError id={hoursErrorId} message={hoursError} />
                                <p className="text-xs text-muted-foreground">Matches your standard work day.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="absence-rounding">Rounding rule</Label>
                                <Input
                                    id="absence-rounding"
                                    name="roundingRule"
                                    type="text"
                                    maxLength={64}
                                    key={`absence-rounding-${state.values.roundingRule}`}
                                    defaultValue={state.values.roundingRule}
                                    aria-invalid={roundingErrorId ? 'true' : undefined}
                                    aria-describedby={roundingErrorId}
                                    placeholder="quarter_day"
                                />
                                <FieldError id={roundingErrorId} message={roundingError} />
                                <p className="text-xs text-muted-foreground">
                                    Optional label for rounding logic (example: quarter_day).
                                </p>
                            </div>
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
