"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { defaultCreateValues, type PermissionResourceCreateState } from '../permission-resource-form-utils';
import { FieldError } from './field-error';
import { permissionKeys } from './permissions.api';
import { createPermissionResourceAction } from '../permission-resource-actions';

export function PermissionResourceCreateForm({ orgId }: { orgId: string }) {
    const formReference = useRef<HTMLFormElement | null>(null);
    const queryClient = useQueryClient();
    const [state, formAction, pending] = useActionState<PermissionResourceCreateState, FormData>(
        createPermissionResourceAction,
        {
            status: 'idle',
            values: defaultCreateValues,
        },
    );

    useEffect(() => {
        if (state.status === 'success') {
            formReference.current?.reset();
            queryClient.invalidateQueries({ queryKey: permissionKeys.list(orgId) }).catch(() => null);
        }
    }, [orgId, queryClient, state.status]);

    const message = state.status === 'error'
        ? state.message ?? 'Unable to create permission resource.'
        : state.status === 'success'
            ? state.message ?? 'Permission resource created.'
            : null;

    const resourceError = state.fieldErrors?.resource;
    const actionsError = state.fieldErrors?.actions;
    const descriptionError = state.fieldErrors?.description;

    return (
        <form
            ref={formReference}
            action={formAction}
            className="space-y-4 rounded-xl border bg-[oklch(var(--muted)/0.2)] p-4"
            aria-busy={pending}
        >
            <div>
                <p className="text-sm font-semibold text-[oklch(var(--foreground))]">Add resource</p>
                <p className="text-xs text-[oklch(var(--muted-foreground))]">Use dot-notation keys that align with your ABAC policies.</p>
            </div>

            <fieldset disabled={pending} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="permission-resource-name">Resource key</Label>
                    <Input
                        id="permission-resource-name"
                        name="resource"
                        required
                        placeholder="hr.leave.request"
                        key={`permission-resource-name-${state.values.resource}`}
                        defaultValue={state.values.resource}
                        className="font-mono"
                        aria-invalid={Boolean(resourceError)}
                        aria-describedby={resourceError ? 'permission-resource-name-error' : undefined}
                    />
                    <FieldError id="permission-resource-name-error" message={resourceError} />
                    <p className="text-xs text-muted-foreground">Example: hr.leave.request</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="permission-resource-actions">Allowed actions</Label>
                    <Textarea
                        id="permission-resource-actions"
                        name="actions"
                        required
                        rows={4}
                        placeholder={'read\nlist\ncreate\nupdate\ndelete'}
                        key={`permission-resource-actions-${state.values.actions}`}
                        defaultValue={state.values.actions}
                        className="font-mono text-xs"
                        aria-invalid={Boolean(actionsError)}
                        aria-describedby={actionsError ? 'permission-resource-actions-error' : undefined}
                    />
                    <FieldError id="permission-resource-actions-error" message={actionsError} />
                    <p className="text-xs text-muted-foreground">Separate actions with commas or new lines.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="permission-resource-description">Description</Label>
                    <Textarea
                        id="permission-resource-description"
                        name="description"
                        rows={3}
                        placeholder="Optional context for admins."
                        key={`permission-resource-description-${state.values.description}`}
                        defaultValue={state.values.description}
                        aria-invalid={Boolean(descriptionError)}
                        aria-describedby={descriptionError ? 'permission-resource-description-error' : undefined}
                    />
                    <FieldError id="permission-resource-description-error" message={descriptionError} />
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Creating...' : 'Create resource'}
                </Button>
                {message ? (
                    <p className={state.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'} role="status" aria-live="polite">{message}</p>
                ) : null}
            </div>
        </form>
    );
}
