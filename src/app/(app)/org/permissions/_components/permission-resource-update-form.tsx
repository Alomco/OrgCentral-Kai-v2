'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { PermissionResource } from '@/server/types/security-types';

import { stringifyActionList, type PermissionResourceInlineState } from '../permission-resource-form-utils';
import { FieldError } from './field-error';
import { permissionKeys } from './permissions.api';
import { updatePermissionResourceAction } from '../permission-resource-actions';

export function PermissionResourceUpdateForm(props: { orgId: string; resource: PermissionResource }) {
    const formReference = useRef<HTMLFormElement | null>(null);
    const qc = useQueryClient();
    const actionsText = stringifyActionList(props.resource.actions);

    const [state, formAction, pending] = useActionState<PermissionResourceInlineState, FormData>(
        updatePermissionResourceAction,
        { status: 'idle' },
    );

    useEffect(() => {
        if (state.status === 'success') {
            Promise.all([
                qc.invalidateQueries({ queryKey: permissionKeys.list(props.orgId) }),
                qc.invalidateQueries({ queryKey: permissionKeys.detail(props.orgId, props.resource.id) }),
            ]).catch(() => null);
        }
    }, [props.orgId, props.resource.id, qc, state.status]);

    const message = state.status === 'error'
        ? state.message
        : state.status === 'success'
            ? state.message ?? 'Permission resource updated.'
            : null;

    const resourceError = state.fieldErrors?.resource;
    const actionsError = state.fieldErrors?.actions;
    const descriptionError = state.fieldErrors?.description;

    return (
        <form ref={formReference} action={formAction} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="resourceId" value={props.resource.id} />
            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor={`permission-resource-name-${props.resource.id}`}>Resource key</Label>
                        <Input
                            id={`permission-resource-name-${props.resource.id}`}
                            name="resource"
                            defaultValue={props.resource.resource}
                            className="font-mono"
                            aria-invalid={Boolean(resourceError)}
                            aria-describedby={resourceError ? `permission-resource-name-${props.resource.id}-error` : undefined}
                        />
                        <FieldError id={`permission-resource-name-${props.resource.id}-error`} message={resourceError} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`permission-resource-description-${props.resource.id}`}>Description</Label>
                        <Textarea
                            id={`permission-resource-description-${props.resource.id}`}
                            name="description"
                            rows={3}
                            defaultValue={props.resource.description ?? ''}
                            aria-invalid={Boolean(descriptionError)}
                            aria-describedby={descriptionError ? `permission-resource-description-${props.resource.id}-error` : undefined}
                        />
                        <FieldError id={`permission-resource-description-${props.resource.id}-error`} message={descriptionError} />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`permission-resource-actions-${props.resource.id}`}>Allowed actions</Label>
                    <Textarea
                        id={`permission-resource-actions-${props.resource.id}`}
                        name="actions"
                        rows={4}
                        defaultValue={actionsText}
                        className="font-mono text-xs"
                        aria-invalid={Boolean(actionsError)}
                        aria-describedby={actionsError ? `permission-resource-actions-${props.resource.id}-error` : undefined}
                    />
                    <FieldError id={`permission-resource-actions-${props.resource.id}-error`} message={actionsError} />
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Saving...' : 'Save'}
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
