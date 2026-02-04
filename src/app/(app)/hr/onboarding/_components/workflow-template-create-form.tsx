'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { createWorkflowTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = {
    status: 'idle',
    message: null,
};

export function WorkflowTemplateCreateForm() {
    const formReference = useRef<HTMLFormElement | null>(null);
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => createWorkflowTemplateAction(formData),
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
            <div className="text-sm font-medium">Create workflow template</div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="workflow-template-name">Name</Label>
                        <Input id="workflow-template-name" name="name" required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="workflow-template-type">Type</Label>
                        <Select name="templateType" defaultValue="ONBOARDING">
                            <SelectTrigger id="workflow-template-type">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                                <SelectItem value="OFFBOARDING">Offboarding</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="workflow-template-description">Description</Label>
                    <Input id="workflow-template-description" name="description" placeholder="Optional description" />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="workflow-template-definition">Definition (JSON)</Label>
                    <Textarea
                        id="workflow-template-definition"
                        name="definition"
                        required
                        placeholder='{"steps":[{"key":"welcome","label":"Welcome","type":"task"}]}'
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
