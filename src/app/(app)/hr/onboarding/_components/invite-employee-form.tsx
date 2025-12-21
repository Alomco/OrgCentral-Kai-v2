'use client';

import { useActionState, useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import type { ChecklistTemplate } from '@/server/types/onboarding-types';

import { inviteEmployeeAction } from '../actions';
import type { OnboardingInviteFormState } from '../form-state';

export interface InviteEmployeeFormProps {
    initialState: OnboardingInviteFormState;
    templates: ChecklistTemplate[];
    canManageTemplates: boolean;
}

export function InviteEmployeeForm({ initialState, templates, canManageTemplates }: InviteEmployeeFormProps) {
    const [state, action, pending] = useActionState(inviteEmployeeAction, initialState);

    const initialIncludeTemplate = useMemo(
        () => state.values.includeTemplate ?? Boolean(state.values.onboardingTemplateId),
        [state.values.includeTemplate, state.values.onboardingTemplateId],
    );
    const [includeTemplate, setIncludeTemplate] = useState<boolean>(initialIncludeTemplate);

    const templateOptions = templates;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invite employee</CardTitle>
                <CardDescription>
                    Creates an onboarding invitation token. Share it with the employee to accept the invite.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {state.status !== 'idle' ? (
                    <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
                        <AlertTitle>{state.status === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>
                            {state.message ?? 'Something went wrong.'}
                            {state.status === 'success' && state.token ? (
                                <div className="mt-2 space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">Invitation token</div>
                                    <Input readOnly value={state.token} />
                                </div>
                            ) : null}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <form action={action} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                defaultValue={state.values.email}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="displayName">Display name</Label>
                            <Input
                                id="displayName"
                                name="displayName"
                                autoComplete="name"
                                defaultValue={state.values.displayName}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="employeeNumber">Employee number</Label>
                            <Input
                                id="employeeNumber"
                                name="employeeNumber"
                                autoComplete="off"
                                defaultValue={state.values.employeeNumber}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="jobTitle">Job title (optional)</Label>
                            <Input
                                id="jobTitle"
                                name="jobTitle"
                                autoComplete="organization-title"
                                defaultValue={state.values.jobTitle ?? ''}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">Attach checklist template</div>
                                <div className="text-xs text-muted-foreground">
                                    {canManageTemplates
                                        ? 'Optionally select a checklist template for the invite.'
                                        : 'You do not have permission to manage templates.'}
                                </div>
                            </div>
                            <input type="hidden" name="includeTemplate" value={String(includeTemplate)} />
                            <Switch checked={includeTemplate} onCheckedChange={setIncludeTemplate} />
                        </div>

                        {includeTemplate ? (
                            <div className="space-y-1.5">
                                <Label>Template</Label>
                                <Select
                                    name="onboardingTemplateId"
                                    defaultValue={state.values.onboardingTemplateId ?? undefined}
                                    disabled={!canManageTemplates || templateOptions.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={templateOptions.length === 0 ? 'No templates available' : 'Select a template'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templateOptions.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={pending}>
                            {pending ? 'Creating…' : 'Create invite'}
                        </Button>
                        <div className="text-xs text-muted-foreground">Invitation creation is never cached.</div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
