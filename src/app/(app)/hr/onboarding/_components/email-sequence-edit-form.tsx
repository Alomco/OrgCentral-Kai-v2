'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';
import type { JsonValue } from '@/server/types/json';

import { updateEmailSequenceTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = { status: 'idle', message: null };

function stringifyJson(value: JsonValue): string {
    return JSON.stringify(value, null, 2);
}

export interface EmailSequenceEditFormProps {
    template: EmailSequenceTemplateRecord;
}

export function EmailSequenceEditForm({ template }: EmailSequenceEditFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => updateEmailSequenceTemplateAction(formData),
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
    const baseId = `email-sequence-${template.id}`;

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
                        <Label htmlFor={`${baseId}-trigger`}>Trigger</Label>
                        <Select name="trigger" defaultValue={template.trigger}>
                            <SelectTrigger id={`${baseId}-trigger`}>
                                <SelectValue />
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
                    <Label htmlFor={`${baseId}-description`}>Description</Label>
                    <Input
                        id={`${baseId}-description`}
                        name="description"
                        defaultValue={template.description ?? ''}
                        placeholder="Optional description"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={`${baseId}-steps`}>Steps (JSON)</Label>
                    <Textarea
                        id={`${baseId}-steps`}
                        name="steps"
                        defaultValue={stringifyJson(template.steps)}
                        required
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={isActiveReference}
                        type="hidden"
                        name="isActive"
                        value={template.isActive ? 'on' : 'off'}
                        key={`email-sequence-active-${template.id}-${template.isActive ? 'on' : 'off'}`}
                    />
                    <Switch
                        id={`${baseId}-active`}
                        key={`email-sequence-active-switch-${template.id}-${template.isActive ? 'on' : 'off'}`}
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