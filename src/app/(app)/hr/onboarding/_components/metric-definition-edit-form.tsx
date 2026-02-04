'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { OnboardingMetricDefinitionRecord } from '@/server/types/hr/onboarding-metrics';

import { updateMetricDefinitionAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = { status: 'idle', message: null };

export interface MetricDefinitionEditFormProps {
    definition: OnboardingMetricDefinitionRecord;
}

export function MetricDefinitionEditForm({ definition }: MetricDefinitionEditFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => updateMetricDefinitionAction(formData),
        initialState,
    );

    const feedbackReference = useRef<HTMLDivElement | null>(null);
    const isActiveReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    const message = state.status === 'idle' ? null : state.message;
    const baseId = `metric-definition-${definition.id}`;

    return (
        <form action={formAction} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="definitionId" value={definition.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground" htmlFor={`${baseId}-key`}>
                        Key
                    </Label>
                    <Input id={`${baseId}-key`} value={definition.key} readOnly />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${baseId}-label`}>Label</Label>
                        <Input id={`${baseId}-label`} name="label" defaultValue={definition.label} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`${baseId}-unit`}>Unit</Label>
                        <Input id={`${baseId}-unit`} name="unit" defaultValue={definition.unit ?? ''} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={`${baseId}-target`}>Target value</Label>
                    <Input
                        id={`${baseId}-target`}
                        name="targetValue"
                        type="number"
                        step="0.01"
                        defaultValue={definition.targetValue ?? ''}
                        placeholder="30"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={isActiveReference}
                        type="hidden"
                        name="isActive"
                        value={definition.isActive ? 'on' : 'off'}
                        key={`metric-definition-active-${definition.id}-${definition.isActive ? 'on' : 'off'}`}
                    />
                    <Switch
                        id={`${baseId}-active`}
                        key={`metric-definition-active-switch-${definition.id}-${definition.isActive ? 'on' : 'off'}`}
                        defaultChecked={definition.isActive}
                        onCheckedChange={(checked) => {
                            if (isActiveReference.current) {
                                isActiveReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        disabled={pending}
                    />
                    <Label htmlFor={`${baseId}-active`} className="text-xs text-muted-foreground">
                        Active
                    </Label>
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Saving…' : 'Save'}
                </Button>
                {message ? (
                    <div
                        ref={feedbackReference}
                        tabIndex={-1}
                        className={state.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {message}
                    </div>
                ) : null}
            </div>
        </form>
    );
}