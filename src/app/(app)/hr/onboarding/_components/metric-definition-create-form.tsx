'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { createMetricDefinitionAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = {
    status: 'idle',
    message: null,
};

export function MetricDefinitionCreateForm() {
    const formReference = useRef<HTMLFormElement | null>(null);
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => createMetricDefinitionAction(formData),
        initialState,
    );

    useEffect(() => {
        if (!pending && state.status === 'success') {
            formReference.current?.reset();
        }
    }, [pending, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form
            ref={formReference}
            action={formAction}
            className="space-y-4 rounded-lg border p-3"
            aria-busy={pending}
        >
            <div className="text-sm font-medium">Create metric definition</div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="metric-key">Key</Label>
                        <Input id="metric-key" name="key" required placeholder="time_to_productivity" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="metric-label">Label</Label>
                        <Input id="metric-label" name="label" required placeholder="Time to productivity" />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="metric-unit">Unit</Label>
                        <Input id="metric-unit" name="unit" placeholder="days" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="metric-target">Target value</Label>
                        <Input id="metric-target" name="targetValue" type="number" step="0.01" placeholder="30" />
                    </div>
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Creating…' : 'Create'}
                </Button>
                {message ? (
                    <p className={state.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                        {message}
                    </p>
                ) : null}
            </div>
        </form>
    );
}
