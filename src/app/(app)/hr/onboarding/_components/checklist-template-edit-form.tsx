'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';

import { FieldError } from '../../_components/field-error';
import { updateChecklistTemplateAction } from '../actions';
import {
    buildInitialChecklistTemplateUpdateFormState,
    type ChecklistTemplateUpdateFormState,
} from '../checklist-templates.form-state';

function stringifyItems(template: ChecklistTemplate): string {
    return template.items
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((item) => item.label)
        .join('\n');
}

export interface ChecklistTemplateEditFormProps {
    template: ChecklistTemplate;
}

export function ChecklistTemplateEditForm({ template }: ChecklistTemplateEditFormProps) {
    const baseId = `template-${template.id}`;
    const nameId = `${baseId}-name`;
    const typeId = `${baseId}-type`;
    const itemsId = `${baseId}-items`;

    const initialState: ChecklistTemplateUpdateFormState = buildInitialChecklistTemplateUpdateFormState({
        templateId: template.id,
        name: template.name,
        type: template.type,
        items: stringifyItems(template),
    });

    const typedAction: (
        previous: ChecklistTemplateUpdateFormState,
        formData: FormData,
    ) => Promise<ChecklistTemplateUpdateFormState> = updateChecklistTemplateAction;

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
        <form action={action} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="templateId" value={template.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor={nameId}>Name</Label>
                    <Input
                        id={nameId}
                        name="name"
                        defaultValue={state.values.name ?? template.name}
                        required
                        aria-invalid={Boolean(nameError)}
                        aria-describedby={nameError ? `${nameId}-error` : undefined}
                    />
                    <FieldError id={`${nameId}-error`} message={nameError} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={typeId}>Type</Label>
                    <Select name="type" defaultValue={state.values.type ?? template.type} disabled={pending}>
                        <SelectTrigger
                            id={typeId}
                            aria-invalid={Boolean(typeError)}
                            aria-describedby={typeError ? `${typeId}-error` : undefined}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="onboarding">onboarding</SelectItem>
                            <SelectItem value="offboarding">offboarding</SelectItem>
                            <SelectItem value="custom">custom</SelectItem>
                        </SelectContent>
                    </Select>
                    <FieldError id={`${typeId}-error`} message={typeError} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={itemsId}>Items</Label>
                    <Textarea
                        id={itemsId}
                        name="items"
                        defaultValue={state.values.items ?? stringifyItems(template)}
                        required
                        aria-invalid={Boolean(itemsError)}
                        aria-describedby={itemsError ? `${itemsId}-error` : undefined}
                    />
                    <FieldError id={`${itemsId}-error`} message={itemsError} />
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Saving…' : 'Save'}
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
                        {state.message ?? 'Unable to save changes.'}
                    </div>
                ) : null}
            </div>
        </form>
    );
}
