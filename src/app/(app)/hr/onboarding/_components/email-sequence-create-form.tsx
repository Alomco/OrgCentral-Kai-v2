'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { createEmailSequenceTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = {
    status: 'idle',
    message: null,
};

export function EmailSequenceCreateForm() {
    const formReference = useRef<HTMLFormElement | null>(null);
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => createEmailSequenceTemplateAction(formData),
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
            <div className="text-sm font-medium">Create email sequence</div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="email-sequence-name">Name</Label>
                        <Input id="email-sequence-name" name="name" required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email-sequence-trigger">Trigger</Label>
                        <Select name="trigger" defaultValue="ONBOARDING_INVITE">
                            <SelectTrigger id="email-sequence-trigger">
                                <SelectValue placeholder="Select a trigger" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ONBOARDING_INVITE">Onboarding invite</SelectItem>
                                <SelectItem value="ONBOARDING_ACCEPTED">Onboarding accepted</SelectItem>
                                <SelectItem value="OFFBOARDING_STARTED">Offboarding started</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email-sequence-description">Description</Label>
                    <Input id="email-sequence-description" name="description" placeholder="Optional description" />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email-sequence-steps">Steps (JSON)</Label>
                    <Textarea
                        id="email-sequence-steps"
                        name="steps"
                        required
                        placeholder='[{"key":"welcome","delayHours":0,"subject":"Welcome","body":"Hello"}]'
                    />
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
