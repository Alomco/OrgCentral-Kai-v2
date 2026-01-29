'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

import type { ChecklistTemplate } from '@/server/types/onboarding-types';

import { FieldError } from '../../_components/field-error';
import { inviteEmployeeAction } from '../actions';
import type { OnboardingInviteFormState } from '../form-state';
import { useInviteEmployeeToast } from './invite-employee-toast';

export interface InviteEmployeeFormProps {
    initialState: OnboardingInviteFormState;
    templates: ChecklistTemplate[];
    canManageTemplates: boolean;
}

interface InviteEmployeeFeedbackProps {
    state: OnboardingInviteFormState;
    feedbackReference: React.RefObject<HTMLDivElement | null>;
}

function InviteEmployeeFeedback({ state, feedbackReference }: InviteEmployeeFeedbackProps) {
    if (state.status === 'idle') {
        return null;
    }

    const isSuccess = state.status === 'success';

    return (
        <div ref={feedbackReference} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
            <Alert variant={isSuccess ? 'default' : 'destructive'}>
                <AlertTitle>{isSuccess ? 'Success' : 'Error'}</AlertTitle>
                <AlertDescription>
                    {state.message ?? 'Something went wrong.'}
                    {isSuccess && state.token ? (
                        <div className="mt-2 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Invitation token</div>
                            <Input readOnly value={state.token} aria-label="Invitation token" />
                        </div>
                    ) : null}
                </AlertDescription>
            </Alert>
        </div>
    );
}

export function InviteEmployeeForm({ initialState, templates, canManageTemplates }: InviteEmployeeFormProps) {
    const [state, action, pending] = useActionState(inviteEmployeeAction, initialState);

    const emailError = state.fieldErrors?.email;
    const displayNameError = state.fieldErrors?.displayName;
    const employeeNumberError = state.fieldErrors?.employeeNumber;
    const jobTitleError = state.fieldErrors?.jobTitle;
    const onboardingTemplateError = state.fieldErrors?.onboardingTemplateId;

    const feedbackReference = useRef<HTMLDivElement | null>(null);
    const formReference = useRef<HTMLFormElement | null>(null);
    const previousStatus = useRef(state.status);

    useEffect(() => {
        const priorStatus = previousStatus.current;
        if (!pending && state.status !== 'idle' && priorStatus !== state.status) {
            feedbackReference.current?.focus();
        }
        previousStatus.current = state.status;
    }, [pending, state.status]);

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
    }, [pending]);

    useInviteEmployeeToast(state, pending);

    const [includeTemplate, setIncludeTemplate] = useState<boolean>(() => (
        initialState.values.includeTemplate ?? Boolean(initialState.values.onboardingTemplateId)
    ));


    const templateOptions = templates;

    const formBody = (
        <fieldset disabled={pending} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        defaultValue={state.values.email}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={emailError ? 'email-error' : undefined}
                        required
                    />
                    <FieldError id="email-error" message={emailError} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                        id="displayName"
                        name="displayName"
                        autoComplete="name"
                        defaultValue={state.values.displayName}
                        aria-invalid={Boolean(displayNameError)}
                        aria-describedby={displayNameError ? 'displayName-error' : undefined}
                        required
                    />
                    <FieldError id="displayName-error" message={displayNameError} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="employeeNumber">Employee number</Label>
                    <Input
                        id="employeeNumber"
                        name="employeeNumber"
                        autoComplete="off"
                        defaultValue={state.values.employeeNumber}
                        aria-invalid={Boolean(employeeNumberError)}
                        aria-describedby={employeeNumberError ? 'employeeNumber-error' : undefined}
                        required
                    />
                    <FieldError id="employeeNumber-error" message={employeeNumberError} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">Job title (optional)</Label>
                    <Input
                        id="jobTitle"
                        name="jobTitle"
                        autoComplete="organization-title"
                        defaultValue={state.values.jobTitle ?? ''}
                        aria-invalid={Boolean(jobTitleError)}
                        aria-describedby={jobTitleError ? 'jobTitle-error' : undefined}
                    />
                    <FieldError id="jobTitle-error" message={jobTitleError} />
                </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                        <div className="text-sm font-medium">Attach checklist template</div>
                        <div id="includeTemplate-help" className="text-xs text-muted-foreground">
                            {canManageTemplates
                                ? 'Optionally select a checklist template for the invite.'
                                : 'You do not have permission to manage templates.'}
                        </div>
                    </div>
                    <input type="hidden" name="includeTemplate" value={String(includeTemplate)} />
                    <Switch
                        checked={includeTemplate}
                        onCheckedChange={setIncludeTemplate}
                        aria-label="Attach checklist template"
                        aria-describedby="includeTemplate-help"
                        disabled={pending}
                    />
                </div>

                {includeTemplate ? (
                    <div className="space-y-1.5">
                        <Label htmlFor="onboardingTemplateId">Template</Label>
                        <Select
                            name="onboardingTemplateId"
                            defaultValue={state.values.onboardingTemplateId ?? undefined}
                            disabled={pending || !canManageTemplates || templateOptions.length === 0}
                        >
                            <SelectTrigger
                                id="onboardingTemplateId"
                                aria-invalid={Boolean(onboardingTemplateError)}
                                aria-describedby={onboardingTemplateError ? 'onboardingTemplateId-error' : undefined}
                            >
                                <SelectValue
                                    placeholder={
                                        templateOptions.length === 0
                                            ? 'No templates available'
                                            : 'Select a template'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {templateOptions.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError id="onboardingTemplateId-error" message={onboardingTemplateError} />
                    </div>
                ) : null}
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Creating...' : 'Create invite'}
                </Button>
                <div className="text-xs text-muted-foreground">Invitation creation is never cached.</div>
            </div>
        </fieldset>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invite employee</CardTitle>
                <CardDescription>
                    Creates an onboarding invitation token. Share it with the employee to accept the invite.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InviteEmployeeFeedback state={state} feedbackReference={feedbackReference} />

                <form ref={formReference} action={action} className="space-y-4">
                    {formBody}
                </form>
            </CardContent>
        </Card>
    );
}
