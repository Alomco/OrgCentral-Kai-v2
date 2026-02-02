'use client';

import { useActionState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { ComplianceTemplate } from '@/server/types/compliance-types';

import { updateComplianceTemplateAction } from '../actions/compliance-templates';
import type { ComplianceTemplateInlineState } from '../compliance-template-form-utils';
import { templatesKey } from '../compliance-templates.api';
import { ComplianceTemplateItemsBuilder } from './compliance-template-items-builder';

const initialInlineState: ComplianceTemplateInlineState = { status: 'idle' };

export function ComplianceTemplateUpdateForm(props: { template: ComplianceTemplate }) {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const qNormalized = (searchParams.get('q') ?? '').trim().toLowerCase();
    const [state, action, pending] = useActionState(updateComplianceTemplateAction, initialInlineState);

    useEffect(() => {
        if (state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: templatesKey.list(qNormalized) }).catch(() => null);
        }
    }, [qNormalized, queryClient, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="templateId" value={props.template.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`compliance-template-name-${props.template.id}`}>Name</Label>
                        <Input
                            id={`compliance-template-name-${props.template.id}`}
                            name="name"
                            defaultValue={props.template.name}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`compliance-template-version-${props.template.id}`}>Version</Label>
                        <Input
                            id={`compliance-template-version-${props.template.id}`}
                            name="version"
                            defaultValue={props.template.version ?? ''}
                        />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                        <Label htmlFor={`compliance-template-category-${props.template.id}`}>
                            Category key
                        </Label>
                        <Input
                            id={`compliance-template-category-${props.template.id}`}
                            name="categoryKey"
                            defaultValue={props.template.categoryKey ?? ''}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`compliance-template-items-${props.template.id}`}>Items list</Label>
                    <ComplianceTemplateItemsBuilder
                        name="itemsJson"
                        inputId={`compliance-template-items-${props.template.id}`}
                        initialItems={props.template.items}
                        disabled={pending}
                    />
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Saving...' : 'Save'}
                </Button>
                {message ? (
                    <p
                        className={
                            state.status === 'error'
                                ? 'text-xs text-destructive'
                                : 'text-xs text-muted-foreground'
                        }
                    >
                        {message}
                    </p>
                ) : null}
            </div>
        </form>
    );
}
