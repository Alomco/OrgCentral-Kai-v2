'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { createChecklistTemplateAction } from '../actions';
import {
    buildInitialChecklistTemplateCreateFormState,
    type ChecklistTemplateCreateFormState,
} from '../checklist-templates.form-state';
import { FieldError } from '../../_components/field-error';

export function ChecklistTemplateCreateForm() {
    const initialState: ChecklistTemplateCreateFormState = buildInitialChecklistTemplateCreateFormState({
        name: '',
        type: 'onboarding',
        items: '',
    });

    const typedAction: (
        previous: ChecklistTemplateCreateFormState,
        formData: FormData,
    ) => Promise<ChecklistTemplateCreateFormState> = createChecklistTemplateAction;

    const [state, action, pending] = useActionState(typedAction, initialState);

    const nameError = state.fieldErrors?.name;
    const typeError = state.fieldErrors?.type;
    const itemsError = state.fieldErrors?.items;

    const feedbackReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    return (
        <form action={action} className="space-y-4 rounded-lg border p-3" aria-busy={pending}>
            <div className="text-sm font-medium">Create template</div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="template-name">Name</Label>
                        <Input
                            id="template-name"
                            name="name"
                            required
                            defaultValue={state.values.name}
                            aria-invalid={Boolean(nameError)}
                            aria-describedby={nameError ? 'template-name-error' : undefined}
                        />
                        <FieldError id="template-name-error" message={nameError} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="template-type">Type</Label>
                        <Select name="type" defaultValue={state.values.type} disabled={pending}>
                            <SelectTrigger
                                id="template-type"
                                aria-invalid={Boolean(typeError)}
                                aria-describedby={typeError ? 'template-type-error' : undefined}
                            >
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="onboarding">onboarding</SelectItem>
                                <SelectItem value="offboarding">offboarding</SelectItem>
                                <SelectItem value="custom">custom</SelectItem>
                            </SelectContent>
                        </Select>
                        <FieldError id="template-type-error" message={typeError} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="template-items">Items (one per line)</Label>
                    <Textarea
                        id="template-items"
                        name="items"
                        required
                        defaultValue={state.values.items}
                        aria-invalid={Boolean(itemsError)}
                        aria-describedby={itemsError ? 'template-items-error' : undefined}
                    />
                    <FieldError id="template-items-error" message={itemsError} />
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Creating…' : 'Create'}
                </Button>
                {state.status === 'error' ? (
                    <div
                        ref={feedbackReference}
                        tabIndex={-1}
                        className="text-sm text-destructive"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.message ?? 'Unable to create template.'}
                    </div>
                ) : null}
            </div>
        </form>
    );
}
