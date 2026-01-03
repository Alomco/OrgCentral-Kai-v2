'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { ComplianceTemplate } from '@/server/types/compliance-types';

import {
    updateComplianceTemplateAction,
    type ComplianceTemplateInlineState,
} from '../actions/compliance-templates';

const initialInlineState: ComplianceTemplateInlineState = { status: 'idle' };

export function ComplianceTemplateUpdateForm(props: { template: ComplianceTemplate }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(updateComplianceTemplateAction, initialInlineState);
    const itemsJson = JSON.stringify(props.template.items, null, 2);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="templateId" value={props.template.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor={`compliance-template-name-${props.template.id}`}>Name</Label>
                        <Input
                            id={`compliance-template-name-${props.template.id}`}
                            name="name"
                            defaultValue={props.template.name}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label htmlFor={`compliance-template-category-${props.template.id}`}>
                                Category key
                            </Label>
                            <Input
                                id={`compliance-template-category-${props.template.id}`}
                                name="categoryKey"
                                defaultValue={props.template.categoryKey ?? ''}
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
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`compliance-template-items-${props.template.id}`}>Template items (JSON)</Label>
                    <Textarea
                        id={`compliance-template-items-${props.template.id}`}
                        name="itemsJson"
                        rows={8}
                        defaultValue={itemsJson}
                        className="font-mono text-xs"
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
