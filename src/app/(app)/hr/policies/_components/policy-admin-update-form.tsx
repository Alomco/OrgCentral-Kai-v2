'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { updatePolicyAdminAction } from '../policy-admin-actions';
import type { PolicyAdminInlineState } from '../policy-admin-form-utils';

const initialInlineState: PolicyAdminInlineState = { status: 'idle' };

function toDateInputValue(value?: Date | string | null): string {
    if (!value) {
        return '';
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }
    return parsed.toISOString().slice(0, 10);
}

function stringifyStringArray(value: unknown): string {
    if (!Array.isArray(value)) {
        return '';
    }
    return value.filter((item) => typeof item === 'string').join(', ');
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

export function PolicyAdminUpdateForm(props: {
    policy: HRPolicy;
    policyCategories: readonly string[];
    statusOptions: readonly string[];
}) {
    const router = useRouter();
    const [state, action, pending] = useActionState(updatePolicyAdminAction, initialInlineState);
    const requiresAckReference = useRef<HTMLInputElement | null>(null);

    const rolesValue = stringifyStringArray(props.policy.applicableRoles);
    const departmentsValue = stringifyStringArray(props.policy.applicableDepartments);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-3">
            <input type="hidden" name="policyId" value={props.policy.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-4">
                    <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`policy-title-${props.policy.id}`}>Title</Label>
                        <Input
                            id={`policy-title-${props.policy.id}`}
                            name="title"
                            defaultValue={props.policy.title}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`policy-category-${props.policy.id}`}>Category</Label>
                        <Select
                            name="category"
                            defaultValue={props.policy.category}
                            disabled={pending}
                        >
                            <SelectTrigger id={`policy-category-${props.policy.id}`}>
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
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`policy-version-${props.policy.id}`}>Version</Label>
                        <Input
                            id={`policy-version-${props.policy.id}`}
                            name="version"
                            defaultValue={props.policy.version}
                        />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <Label htmlFor={`policy-effective-${props.policy.id}`}>Effective date</Label>
                        <Input
                            id={`policy-effective-${props.policy.id}`}
                            name="effectiveDate"
                            type="date"
                            defaultValue={toDateInputValue(props.policy.effectiveDate)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`policy-expiry-${props.policy.id}`}>Expiry date</Label>
                        <Input
                            id={`policy-expiry-${props.policy.id}`}
                            name="expiryDate"
                            type="date"
                            defaultValue={toDateInputValue(props.policy.expiryDate ?? null)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`policy-status-${props.policy.id}`}>Status</Label>
                        <Select
                            name="status"
                            defaultValue={props.policy.status}
                            disabled={pending}
                        >
                            <SelectTrigger id={`policy-status-${props.policy.id}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {props.statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {formatStatusLabel(status)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <input
                            ref={requiresAckReference}
                            type="hidden"
                            name="requiresAcknowledgment"
                            value={props.policy.requiresAcknowledgment ? 'on' : 'off'}
                            key={`policy-ack-${props.policy.id}-${props.policy.requiresAcknowledgment ? 'on' : 'off'}`}
                        />
                        <Switch
                            id={`policy-ack-${props.policy.id}`}
                            key={`policy-ack-switch-${props.policy.id}-${props.policy.requiresAcknowledgment ? 'on' : 'off'}`}
                            defaultChecked={props.policy.requiresAcknowledgment}
                            onCheckedChange={(checked) => {
                                if (requiresAckReference.current) {
                                    requiresAckReference.current.value = checked ? 'on' : 'off';
                                }
                            }}
                            disabled={pending}
                        />
                        <Label htmlFor={`policy-ack-${props.policy.id}`} className="text-xs text-muted-foreground">
                            Requires acknowledgment
                        </Label>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor={`policy-roles-${props.policy.id}`}>Applicable roles</Label>
                        <Input
                            id={`policy-roles-${props.policy.id}`}
                            name="applicableRoles"
                            defaultValue={rolesValue}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`policy-departments-${props.policy.id}`}>Applicable departments</Label>
                        <Input
                            id={`policy-departments-${props.policy.id}`}
                            name="applicableDepartments"
                            defaultValue={departmentsValue}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`policy-content-${props.policy.id}`}>Policy content</Label>
                    <Textarea
                        id={`policy-content-${props.policy.id}`}
                        name="content"
                        rows={6}
                        defaultValue={props.policy.content}
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
