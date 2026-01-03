'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { FieldError } from '../../_components/field-error';
import {
    createPolicyAdminAction,
    type PolicyAdminCreateState,
} from '../policy-admin-actions';
import { PolicyAdminRow } from './policy-admin-row';

function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function formatCategoryLabel(value: string): string {
    return value
        .split('_')
        .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
        .join(' ');
}

function formatStatusLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PolicyAdminManager(props: {
    policies: HRPolicy[];
    policyCategories: readonly string[];
}) {
    const router = useRouter();
    const initialState = useMemo<PolicyAdminCreateState>(() => ({
        status: 'idle',
        values: {
            title: '',
            content: '',
            category: (props.policyCategories[0] ?? 'HR_POLICIES') as PolicyAdminCreateState['values']['category'],
            version: '1',
            effectiveDate: toDateInputValue(new Date()),
            expiryDate: '',
            status: 'draft',
            requiresAcknowledgment: true,
            applicableRoles: '',
            applicableDepartments: '',
        },
    }), [props.policyCategories]);
    const [state, action, pending] = useActionState(createPolicyAdminAction, initialState);
    const formReference = useRef<HTMLFormElement | null>(null);
    const requiresAckReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'success') {
            router.refresh();
            formReference.current?.reset();
        }
    }, [pending, router, state.status]);

    const message =
        state.status === 'error'
            ? state.message
            : state.status === 'success'
                ? state.message
                : null;

    return (
        <div className="space-y-6">
            <form ref={formReference} action={action} className="space-y-4" aria-busy={pending}>
                <fieldset disabled={pending} className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-4">
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="policy-title">Title</Label>
                            <Input
                                id="policy-title"
                                name="title"
                                required
                                key={`policy-title-${state.values.title}`}
                                defaultValue={state.values.title}
                                aria-invalid={Boolean(state.fieldErrors?.title)}
                                aria-describedby={state.fieldErrors?.title ? 'policy-title-error' : undefined}
                            />
                            <FieldError id="policy-title-error" message={state.fieldErrors?.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-category">Category</Label>
                            <Select
                                name="category"
                                defaultValue={state.values.category}
                                disabled={pending}
                            >
                                <SelectTrigger id="policy-category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.policyCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {formatCategoryLabel(category)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError id="policy-category-error" message={state.fieldErrors?.category} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-version">Version</Label>
                            <Input id="policy-version" name="version" required key={`policy-version-${state.values.version}`} defaultValue={state.values.version} aria-invalid={Boolean(state.fieldErrors?.version)} aria-describedby={state.fieldErrors?.version ? 'policy-version-error' : undefined} />
                            <FieldError id="policy-version-error" message={state.fieldErrors?.version} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="policy-effective">Effective date</Label>
                            <Input
                                id="policy-effective"
                                name="effectiveDate"
                                type="date"
                                required
                                key={`policy-effective-${state.values.effectiveDate}`}
                                defaultValue={state.values.effectiveDate}
                                aria-invalid={Boolean(state.fieldErrors?.effectiveDate)}
                                aria-describedby={state.fieldErrors?.effectiveDate ? 'policy-effective-error' : undefined}
                            />
                            <FieldError id="policy-effective-error" message={state.fieldErrors?.effectiveDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-expiry">Expiry date</Label>
                            <Input
                                id="policy-expiry"
                                name="expiryDate"
                                type="date"
                                key={`policy-expiry-${state.values.expiryDate}`}
                                defaultValue={state.values.expiryDate}
                                aria-invalid={Boolean(state.fieldErrors?.expiryDate)}
                                aria-describedby={state.fieldErrors?.expiryDate ? 'policy-expiry-error' : undefined}
                            />
                            <FieldError id="policy-expiry-error" message={state.fieldErrors?.expiryDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-status">Status</Label>
                            <Select name="status" defaultValue={state.values.status} disabled={pending}>
                                <SelectTrigger id="policy-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['draft', 'active'].map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {formatStatusLabel(status)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError id="policy-status-error" message={state.fieldErrors?.status} />
                        </div>

                        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                            <input
                                ref={requiresAckReference}
                                type="hidden"
                                name="requiresAcknowledgment"
                                value={state.values.requiresAcknowledgment ? 'on' : 'off'}
                                key={`policy-ack-${state.values.requiresAcknowledgment ? 'on' : 'off'}`}
                            />
                            <Switch
                                id="policy-ack"
                                key={`policy-ack-switch-${state.values.requiresAcknowledgment ? 'on' : 'off'}`}
                                defaultChecked={state.values.requiresAcknowledgment}
                                onCheckedChange={(checked) => {
                                    if (requiresAckReference.current) {
                                        requiresAckReference.current.value = checked ? 'on' : 'off';
                                    }
                                }}
                                disabled={pending}
                            />
                            <Label htmlFor="policy-ack" className="text-xs text-muted-foreground">
                                Requires acknowledgment
                            </Label>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="policy-roles">Applicable roles</Label>
                            <Input
                                id="policy-roles"
                                name="applicableRoles"
                                placeholder="member, manager, hrAdmin"
                                key={`policy-roles-${state.values.applicableRoles}`}
                                defaultValue={state.values.applicableRoles}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-departments">Applicable departments</Label>
                            <Input
                                id="policy-departments"
                                name="applicableDepartments"
                                placeholder="engineering, finance"
                                key={`policy-departments-${state.values.applicableDepartments}`}
                                defaultValue={state.values.applicableDepartments}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="policy-content">Policy content</Label>
                        <Textarea
                            id="policy-content"
                            name="content"
                            required
                            rows={6}
                            key={`policy-content-${state.values.content}`}
                            defaultValue={state.values.content}
                            aria-invalid={Boolean(state.fieldErrors?.content)}
                            aria-describedby={state.fieldErrors?.content ? 'policy-content-error' : undefined}
                        />
                        <FieldError id="policy-content-error" message={state.fieldErrors?.content} />
                    </div>
                </fieldset>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Creating...' : 'Create policy'}
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

            <div className="text-sm font-medium">Existing policies</div>
            {props.policies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No policies configured yet.</p>
            ) : (
                <div className="space-y-3">
                    {props.policies.map((policy) => (
                        <PolicyAdminRow
                            key={policy.id}
                            policy={policy}
                            policyCategories={props.policyCategories}
                            statusOptions={['draft', 'active']}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
