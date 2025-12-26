'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { FieldError } from '../../_components/field-error';
import { submitLeaveRequestAction } from '../actions';
import type { LeaveRequestFormState } from '../form-state';

export interface LeaveRequestFormProps {
    initialState: LeaveRequestFormState;
}

export function LeaveRequestForm({ initialState }: LeaveRequestFormProps) {
    const [state, action, pending] = useActionState(submitLeaveRequestAction, initialState);

    const leaveTypeErrorId = state.fieldErrors?.leaveType ? 'leaveType-error' : undefined;
    const totalDaysErrorId = state.fieldErrors?.totalDays ? 'totalDays-error' : undefined;
    const startDateErrorId = state.fieldErrors?.startDate ? 'startDate-error' : undefined;
    const endDateErrorId = state.fieldErrors?.endDate ? 'endDate-error' : undefined;
    const reasonErrorId = state.fieldErrors?.reason ? 'reason-error' : undefined;

    const feedbackReference = useRef<HTMLDivElement | null>(null);
    const formReference = useRef<HTMLFormElement | null>(null);
    const previousStatus = useRef(state.status);

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (!pending && state.status !== 'idle' && previousStatus.current !== state.status) {
            feedbackReference.current?.focus();
        }
        previousStatus.current = state.status;
    }, [pending, state.status]);

    const initialIsHalfDay = useMemo(() => state.values.isHalfDay ?? false, [state.values.isHalfDay]);
    const [isHalfDay, setIsHalfDay] = useState<boolean>(initialIsHalfDay);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit request</CardTitle>
                <CardDescription>Requests are scoped to your current organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {state.status !== 'idle' ? (
                    <div ref={feedbackReference} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
                        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
                            <AlertTitle>{state.status === 'success' ? 'Success' : 'Error'}</AlertTitle>
                            <AlertDescription>{state.message ?? 'Something went wrong.'}</AlertDescription>
                        </Alert>
                    </div>
                ) : null}

                <form ref={formReference} action={action} className="space-y-4" aria-busy="false">
                    <fieldset disabled={pending} className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="leaveType">Leave type</Label>
                                <Input
                                    id="leaveType"
                                    name="leaveType"
                                    autoComplete="off"
                                    defaultValue={state.values.leaveType}
                                    placeholder="ANNUAL"
                                    required
                                    aria-invalid={leaveTypeErrorId ? 'true' : undefined}
                                    aria-describedby={leaveTypeErrorId}
                                />
                                <FieldError id={leaveTypeErrorId} message={state.fieldErrors?.leaveType} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="totalDays">Total days</Label>
                                <Input
                                    id="totalDays"
                                    name="totalDays"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    min="0.5"
                                    max="365"
                                    defaultValue={state.values.totalDays}
                                    required
                                    aria-invalid={totalDaysErrorId ? 'true' : undefined}
                                    aria-describedby={totalDaysErrorId}
                                />
                                <FieldError id={totalDaysErrorId} message={state.fieldErrors?.totalDays} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="startDate">Start date</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    defaultValue={state.values.startDate}
                                    required
                                    aria-invalid={startDateErrorId ? 'true' : undefined}
                                    aria-describedby={startDateErrorId}
                                />
                                <FieldError id={startDateErrorId} message={state.fieldErrors?.startDate} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="endDate">End date</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    defaultValue={state.values.endDate ?? ''}
                                    aria-invalid={endDateErrorId ? 'true' : undefined}
                                    aria-describedby={endDateErrorId}
                                />
                                <FieldError id={endDateErrorId} message={state.fieldErrors?.endDate} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">Half day</div>
                                <div id="isHalfDay-help" className="text-xs text-muted-foreground">Marks the request as a half-day absence.</div>
                            </div>
                            <input type="hidden" name="isHalfDay" value={String(isHalfDay)} />
                            <Switch
                                checked={isHalfDay}
                                onCheckedChange={setIsHalfDay}
                                aria-label="Half day"
                                aria-describedby="isHalfDay-help"
                                disabled={pending}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Textarea
                                id="reason"
                                name="reason"
                                rows={4}
                                defaultValue={state.values.reason ?? ''}
                                placeholder="Add a short note for your manager"
                                aria-invalid={reasonErrorId ? 'true' : undefined}
                                aria-describedby={reasonErrorId}
                            />
                            <FieldError id={reasonErrorId} message={state.fieldErrors?.reason} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={pending}>
                                {pending ? <Spinner className="mr-2" /> : null}
                                {pending ? 'Submitting…' : 'Submit request'}
                            </Button>
                            <div className="text-xs text-muted-foreground">No sensitive data is cached.</div>
                        </div>
                    </fieldset>
                </form>
            </CardContent>
        </Card>
    );
}
