'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { InfoButton } from '@/components/ui/info-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { PermissionResource } from '@/server/types/security-types';

import {
    parseActionList,
    stringifyActionList,
    type FieldErrors,
    type PermissionResourceFormValues,
} from '../permission-resource-form-utils';
import { FieldError } from './field-error';
import { permissionKeys, updatePermissionResource } from './permissions.api';

interface UpdatePayload {
    resource: string;
    actions: string;
    description: string;
}

interface UpdateContext {
    previousList?: PermissionResource[];
    previousDetail?: PermissionResource;
}

export function PermissionResourceUpdateForm(props: { orgId: string; resource: PermissionResource }) {
    const qc = useQueryClient();
    const [message, setMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<PermissionResourceFormValues> | undefined>(undefined);
    const actionsText = stringifyActionList(props.resource.actions);

    const update = useMutation<undefined, Error, UpdatePayload, UpdateContext>({
        mutationFn: async (payload) => {
            const actions = parseActionList(payload.actions);
            const resource = payload.resource.trim();
            const description = payload.description.trim();
            await updatePermissionResource(props.orgId, props.resource.id, {
                resource,
                actions,
                description: description.length > 0 ? description : undefined,
            });
            return undefined;
        },
        onMutate: async (payload) => {
            const listKey = permissionKeys.list(props.orgId);
            const detailKey = permissionKeys.detail(props.orgId, props.resource.id);
            await Promise.all([
                qc.cancelQueries({ queryKey: listKey }),
                qc.cancelQueries({ queryKey: detailKey }),
            ]);
            const previousList = qc.getQueryData<PermissionResource[]>(listKey);
            const previousDetail = qc.getQueryData<PermissionResource>(detailKey);

            const actions = parseActionList(payload.actions);
            const description = payload.description.trim();
            const updated: PermissionResource = {
                ...props.resource,
                resource: payload.resource.trim(),
                actions,
                description: description.length > 0 ? description : null,
                updatedAt: new Date(),
            };

            qc.setQueryData<PermissionResource[]>(
                listKey,
                (old) => (old ? old.map((item) => (item.id === updated.id ? updated : item)) : old),
            );
            qc.setQueryData(detailKey, updated);

            return { previousList, previousDetail };
        },
        onError: (error, _payload, context) => {
            const listKey = permissionKeys.list(props.orgId);
            const detailKey = permissionKeys.detail(props.orgId, props.resource.id);
            if (context?.previousList) {
                qc.setQueryData(listKey, context.previousList);
            }
            if (context?.previousDetail) {
                qc.setQueryData(detailKey, context.previousDetail);
            }
            setMessage(error.message || 'Unable to update permission resource.');
        },
        onSuccess: () => {
            setMessage('Permission resource updated.');
        },
        onSettled: () => {
            const listKey = permissionKeys.list(props.orgId);
            const detailKey = permissionKeys.detail(props.orgId, props.resource.id);
            Promise.all([
                qc.invalidateQueries({ queryKey: listKey }),
                qc.invalidateQueries({ queryKey: detailKey }),
            ]).catch(() => null);
        },
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        const resourceValue = formData.get('resource');
        const actionsValue = formData.get('actions');
        const descriptionValue = formData.get('description');
        const resource = typeof resourceValue === 'string' ? resourceValue : '';
        const actions = typeof actionsValue === 'string' ? actionsValue : '';
        const description = typeof descriptionValue === 'string' ? descriptionValue : '';

        const errors: FieldErrors<PermissionResourceFormValues> = {};
        if (resource.trim().length === 0) {
            errors.resource = 'Resource name is required.';
        }
        if (parseActionList(actions).length === 0) {
            errors.actions = 'At least one action is required.';
        }
        if (description.trim().length > 300) {
            errors.description = 'Description must be 300 characters or less.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors(undefined);
        update.mutate({ resource, actions, description });
    };

    const pending = update.isPending;
    const resourceError = fieldErrors?.resource;
    const actionsError = fieldErrors?.actions;
    const descriptionError = fieldErrors?.description;

    return (
        <form onSubmit={handleSubmit} className="space-y-3" aria-busy={pending}>
            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`permission-resource-name-${props.resource.id}`}>Resource key</Label>
                            <InfoButton
                                label="Resource key"
                                sections={[
                                    { label: 'What', text: 'Canonical key used in checks and policies.' },
                                    { label: 'Prereqs', text: 'Stick to dot-notation namespaces.' },
                                    { label: 'Next', text: 'Update policies if you rename keys.' },
                                    { label: 'Compliance', text: 'Renames impact audit trails.' },
                                ]}
                            />
                        </div>
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
                    <p className={update.isError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                        {message}
                    </p>
                ) : null}
            </div>
        </form>
    );
}