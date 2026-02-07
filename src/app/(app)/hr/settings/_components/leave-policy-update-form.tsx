'use client';

import { useActionState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { LeavePolicy } from '@/server/types/leave-types';

import { updateLeavePolicyAction } from '../leave-policy-actions';
import type { LeavePolicyInlineState } from '../leave-policy-form-utils';
import { formatPolicyType, toDateInputValue } from './leave-policy-form-utils';
import { LEAVE_POLICIES_QUERY_KEY } from '../leave-policy-query';
import { LeavePolicyToggleField } from './leave-policy-toggle-field';

const initialInlineState: LeavePolicyInlineState = { status: 'idle' };

export function LeavePolicyUpdateForm(props: {
    policy: LeavePolicy;
    policyTypes: readonly string[];
}) {
    const queryClient = useQueryClient();
    const handleUpdate = async (
        previous: LeavePolicyInlineState,
        formData: FormData,
    ): Promise<LeavePolicyInlineState> => {
        const next = await updateLeavePolicyAction(previous, formData);
        if (next.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: LEAVE_POLICIES_QUERY_KEY }).catch(() => null);
        }
        return next;
    };
    const [state, action, pending] = useActionState(handleUpdate, initialInlineState);
    const requiresApprovalReference = useRef<HTMLInputElement | null>(null);
    const isDefaultReference = useRef<HTMLInputElement | null>(null);
    const statutoryReference = useRef<HTMLInputElement | null>(null);
    const allowNegativeReference = useRef<HTMLInputElement | null>(null);

    const updateMessage = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-3" aria-busy={pending}>
            <input type="hidden" name="policyId" value={props.policy.id} />

            <fieldset disabled={pending} className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-4">
                    <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`leave-policy-name-${props.policy.id}`}>Name</Label>
                        <Input id={`leave-policy-name-${props.policy.id}`} name="name" defaultValue={props.policy.name} />
                        <p className="text-xs text-muted-foreground">Visible to employees in leave requests.</p>
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
                        <p className="text-xs text-muted-foreground">Days earned per year.</p>
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
                    <LeavePolicyToggleField
                        id={`leave-policy-requires-${props.policy.id}`}
                        hiddenInputName="requiresApproval"
                        hiddenInputValue={props.policy.requiresApproval ? 'on' : 'off'}
                        hiddenInputReference={requiresApprovalReference}
                        defaultChecked={props.policy.requiresApproval}
                        disabled={pending}
                        label="Requires approval"
                        infoLabel="Requires approval"
                        infoSections={[
                            { label: 'What', text: 'Requires approval before booking.' },
                            { label: 'Prereqs', text: 'Approval workflows enabled.' },
                            { label: 'Next', text: 'Enable for controlled leave types.' },
                            { label: 'Compliance', text: 'Approvals are audited.' },
                        ]}
                    />
                    <LeavePolicyToggleField
                        id={`leave-policy-default-${props.policy.id}`}
                        hiddenInputName="isDefault"
                        hiddenInputValue={props.policy.isDefault ? 'on' : 'off'}
                        hiddenInputReference={isDefaultReference}
                        defaultChecked={props.policy.isDefault}
                        disabled={pending}
                        label="Default policy"
                    />
                    <LeavePolicyToggleField
                        id={`leave-policy-statutory-${props.policy.id}`}
                        hiddenInputName="statutoryCompliance"
                        hiddenInputValue={props.policy.statutoryCompliance ? 'on' : 'off'}
                        hiddenInputReference={statutoryReference}
                        defaultChecked={Boolean(props.policy.statutoryCompliance)}
                        disabled={pending}
                        label="Statutory compliance"
                        infoLabel="Statutory compliance"
                        infoSections={[
                            { label: 'What', text: 'Applies statutory rules to this policy.' },
                            { label: 'Prereqs', text: 'Use for legally mandated leave.' },
                            { label: 'Next', text: 'Review accrual limits.' },
                            { label: 'Compliance', text: 'Keeps policy aligned with law.' },
                        ]}
                    />
                    <LeavePolicyToggleField
                        id={`leave-policy-negative-${props.policy.id}`}
                        hiddenInputName="allowNegativeBalance"
                        hiddenInputValue={props.policy.allowNegativeBalance ? 'on' : 'off'}
                        hiddenInputReference={allowNegativeReference}
                        defaultChecked={Boolean(props.policy.allowNegativeBalance)}
                        disabled={pending}
                        label="Allow negative balance"
                    />
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
