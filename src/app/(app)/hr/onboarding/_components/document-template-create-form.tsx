'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { createDocumentTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = {
    status: 'idle',
    message: null,
};

const documentTypeOptions = [
    'ONBOARDING',
    'POLICY',
    'CONTRACT',
    'EVIDENCE',
    'TRAINING',
    'PERFORMANCE',
    'COMPLIANCE',
    'MEDICAL',
    'FINANCIAL',
    'SECURITY',
    'OTHER',
] as const;

export function DocumentTemplateCreateForm() {
    const formReference = useRef<HTMLFormElement | null>(null);
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => createDocumentTemplateAction(formData),
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
            <div className="text-sm font-medium">Create document template</div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="document-template-name">Name</Label>
                        <Input id="document-template-name" name="name" required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="document-template-type">Type</Label>
                        <Select name="type" defaultValue="ONBOARDING">
                            <SelectTrigger id="document-template-type">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypeOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="document-template-body">Template body</Label>
                    <Textarea
                        id="document-template-body"
                        name="templateBody"
                        required
                        placeholder="Enter template content or markup"
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
