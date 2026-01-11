'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { LeavePolicy } from '@/server/types/leave-types';

import { updateLeavePolicyAction } from '../leave-policy-actions';
import type { LeavePolicyInlineState } from '../leave-policy-form-utils';
import { formatPolicyType, toDateInputValue } from './leave-policy-form-utils';

const initialInlineState: LeavePolicyInlineState = { status: 'idle' };

export function LeavePolicyUpdateForm(props: {
    policy: LeavePolicy;
    policyTypes: readonly string[];
}) {
    const router = useRouter();
    const [state, action, pending] = useActionState(updateLeavePolicyAction, initialInlineState);
    const requiresApprovalReference = useRef<HTMLInputElement | null>(null);
    const isDefaultReference = useRef<HTMLInputElement | null>(null);
    const statutoryReference = useRef<HTMLInputElement | null>(null);
    const allowNegativeReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    const updateMessage = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="policyId" value={props.policy.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-4">
                    <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`leave-policy-name-${props.policy.id}`}>Name</Label>
                        <Input id={`leave-policy-name-${props.policy.id}`} name="name" defaultValue={props.policy.name} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-type-${props.policy.id}`}>Type</Label>
                        <Select name="type" defaultValue={props.policy.policyType} disabled={pending}>
                            <SelectTrigger id={`leave-policy-type-${props.policy.id}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {props.policyTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {formatPolicyType(type)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-accrual-${props.policy.id}`}>Annual accrual</Label>
                        <Input id={`leave-policy-accrual-${props.policy.id}`} name="accrualAmount" type="number" inputMode="numeric" min={0} max={366} step={0.5} defaultValue={props.policy.accrualAmount ?? ''} />
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-carry-${props.policy.id}`}>Carry over limit</Label>
                        <Input
                            id={`leave-policy-carry-${props.policy.id}`}
                            name="carryOverLimit"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            defaultValue={props.policy.carryOverLimit ?? ''}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-max-${props.policy.id}`}>Max consecutive days</Label>
                        <Input
                            id={`leave-policy-max-${props.policy.id}`}
                            name="maxConsecutiveDays"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            defaultValue={props.policy.maxConsecutiveDays ?? ''}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-active-from-${props.policy.id}`}>Active from</Label>
                        <Input
                            id={`leave-policy-active-from-${props.policy.id}`}
                            name="activeFrom"
                            type="date"
                            defaultValue={toDateInputValue(props.policy.activeFrom)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`leave-policy-active-to-${props.policy.id}`}>Active to</Label>
                        <Input
                            id={`leave-policy-active-to-${props.policy.id}`}
                            name="activeTo"
                            type="date"
                            defaultValue={toDateInputValue(props.policy.activeTo)}
                        />
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <input
                            ref={requiresApprovalReference}
                            type="hidden"
                            name="requiresApproval"
                            value={props.policy.requiresApproval ? 'on' : 'off'}
                            key={`leave-policy-requires-${props.policy.id}-${props.policy.requiresApproval ? 'on' : 'off'}`}
                        />
                        <Switch
                            id={`leave-policy-requires-${props.policy.id}`}
                            key={`leave-policy-requires-switch-${props.policy.id}-${props.policy.requiresApproval ? 'on' : 'off'}`}
                            defaultChecked={props.policy.requiresApproval}
                            onCheckedChange={(checked) => {
                                if (requiresApprovalReference.current) {
                                    requiresApprovalReference.current.value = checked ? 'on' : 'off';
                                }
                            }}
                            disabled={pending}
                        />
                        <Label
                            htmlFor={`leave-policy-requires-${props.policy.id}`}
                            className="text-xs text-muted-foreground"
                        >
                            Requires approval
                        </Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <input
                            ref={isDefaultReference}
                            type="hidden"
                            name="isDefault"
                            value={props.policy.isDefault ? 'on' : 'off'}
                            key={`leave-policy-default-${props.policy.id}-${props.policy.isDefault ? 'on' : 'off'}`}
                        />
                        <Switch
                            id={`leave-policy-default-${props.policy.id}`}
                            key={`leave-policy-default-switch-${props.policy.id}-${props.policy.isDefault ? 'on' : 'off'}`}
                            defaultChecked={props.policy.isDefault}
                            onCheckedChange={(checked) => {
                                if (isDefaultReference.current) {
                                    isDefaultReference.current.value = checked ? 'on' : 'off';
                                }
                            }}
                            disabled={pending}
                        />
                        <Label
                            htmlFor={`leave-policy-default-${props.policy.id}`}
                            className="text-xs text-muted-foreground"
                        >
                            Default policy
                        </Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <input
                            ref={statutoryReference}
                            type="hidden"
                            name="statutoryCompliance"
                            value={props.policy.statutoryCompliance ? 'on' : 'off'}
                            key={`leave-policy-statutory-${props.policy.id}-${props.policy.statutoryCompliance ? 'on' : 'off'}`}
                        />
                        <Switch
                            id={`leave-policy-statutory-${props.policy.id}`}
                            key={`leave-policy-statutory-switch-${props.policy.id}-${props.policy.statutoryCompliance ? 'on' : 'off'}`}
                            defaultChecked={Boolean(props.policy.statutoryCompliance)}
                            onCheckedChange={(checked) => {
                                if (statutoryReference.current) {
                                    statutoryReference.current.value = checked ? 'on' : 'off';
                                }
                            }}
                            disabled={pending}
                        />
                        <Label
                            htmlFor={`leave-policy-statutory-${props.policy.id}`}
                            className="text-xs text-muted-foreground"
                        >
                            Statutory compliance
                        </Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <input
                            ref={allowNegativeReference}
                            type="hidden"
                            name="allowNegativeBalance"
                            value={props.policy.allowNegativeBalance ? 'on' : 'off'}
                            key={`leave-policy-negative-${props.policy.id}-${props.policy.allowNegativeBalance ? 'on' : 'off'}`}
                        />
                        <Switch
                            id={`leave-policy-negative-${props.policy.id}`}
                            key={`leave-policy-negative-switch-${props.policy.id}-${props.policy.allowNegativeBalance ? 'on' : 'off'}`}
                            defaultChecked={Boolean(props.policy.allowNegativeBalance)}
                            onCheckedChange={(checked) => {
                                if (allowNegativeReference.current) {
                                    allowNegativeReference.current.value = checked ? 'on' : 'off';
                                }
                            }}
                            disabled={pending}
                        />
                        <Label
                            htmlFor={`leave-policy-negative-${props.policy.id}`}
                            className="text-xs text-muted-foreground"
                        >
                            Allow negative balance
                        </Label>
                    </div>
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Saving...' : 'Save'}
                </Button>
                {updateMessage ? (
                    <p
                        className={
                            state.status === 'error'
                                ? 'text-xs text-destructive'
                                : 'text-xs text-muted-foreground'
                        }
                    >
                        {updateMessage}
                    </p>
                ) : null}
            </div>
        </form>
    );
}
