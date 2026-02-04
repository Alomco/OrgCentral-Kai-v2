'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';

import { updateDocumentTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = { status: 'idle', message: null };

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

export interface DocumentTemplateEditFormProps {
    template: DocumentTemplateRecord;
}

export function DocumentTemplateEditForm({ template }: DocumentTemplateEditFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => updateDocumentTemplateAction(formData),
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
    const baseId = `document-template-${template.id}`;

    return (
        <form action={formAction} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="templateId" value={template.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${baseId}-name`}>Name</Label>
                        <Input id={`${baseId}-name`} name="name" defaultValue={template.name} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`${baseId}-type`}>Type</Label>
                        <Select name="type" defaultValue={template.type}>
                            <SelectTrigger id={`${baseId}-type`}>
                                <SelectValue />
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
                    <Label htmlFor={`${baseId}-body`}>Template body</Label>
                    <Textarea
                        id={`${baseId}-body`}
                        name="templateBody"
                        defaultValue={template.templateBody}
                        required
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={isActiveReference}
                        type="hidden"
                        name="isActive"
                        value={template.isActive ? 'on' : 'off'}
                        key={`document-template-active-${template.id}-${template.isActive ? 'on' : 'off'}`}
                    />
                    <Switch
                        id={`${baseId}-active`}
                        key={`document-template-active-switch-${template.id}-${template.isActive ? 'on' : 'off'}`}
                        defaultChecked={template.isActive}
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