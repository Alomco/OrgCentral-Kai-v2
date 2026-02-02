'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';

import { updateComplianceReminderSettingsAction, type ComplianceReminderSettingsActionState } from '../actions/compliance-reminder-settings';

interface ComplianceReminderSettingsFormProps {
    defaults: {
        windowDays: number;
        escalationDays: number[];
        notifyOnComplete: boolean;
    };
}

const INITIAL_STATE: ComplianceReminderSettingsActionState = { status: 'idle' };

export function ComplianceReminderSettingsForm({ defaults }: ComplianceReminderSettingsFormProps) {
    const [state, formAction, pending] = useActionState(updateComplianceReminderSettingsAction, INITIAL_STATE);
    const formReference = useRef<HTMLFormElement | null>(null);
    const statusReference = useRef<HTMLParagraphElement | null>(null);
    const previousStatus = useRef(state.status);

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
                    <CardTitle>Reminder workflows</CardTitle>
                    <CardDescription>Configure when compliance reminders and escalations are sent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <fieldset disabled={pending} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="compliance-window">Reminder window (days)</Label>
                                <Input
                                    id="compliance-window"
                                    name="windowDays"
                                    type="number"
                                    min={1}
                                    max={180}
                                    step={1}
                                    defaultValue={defaults.windowDays}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="compliance-escalations">Escalation days</Label>
                                <Input
                                    id="compliance-escalations"
                                    name="escalationDays"
                                    placeholder="30, 14, 7, 1"
                                    defaultValue={defaults.escalationDays.join(', ')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated day offsets before due date.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="compliance-notify-complete">Notify on completed items</Label>
                                <p className="text-xs text-muted-foreground">
                                    Send expiry reminders for completed documents.
                                </p>
                            </div>
                            <input
                                type="hidden"
                                name="notifyOnComplete"
                                value={defaults.notifyOnComplete ? 'on' : 'off'}
                            />
                            <Switch
                                id="compliance-notify-complete"
                                defaultChecked={defaults.notifyOnComplete}
                                onCheckedChange={(checked) => {
                                    const input = formReference.current?.elements.namedItem('notifyOnComplete');
                                    if (input instanceof HTMLInputElement) {
                                        input.value = checked ? 'on' : 'off';
                                    }
                                }}
                                aria-label="Notify on completed items"
                                disabled={pending}
                            />
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
                        {pending ? 'Saving...' : 'Save'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
