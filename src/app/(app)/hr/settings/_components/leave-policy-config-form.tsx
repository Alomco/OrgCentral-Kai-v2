'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { LeavePolicy } from '@/server/types/leave-types';

import { FieldError } from '../../_components/field-error';
import { createLeavePolicyAction } from '../leave-policy-actions';
import type { LeavePolicyCreateState } from '../leave-policy-form-utils';
import { LeavePolicyRow } from './leave-policy-row';

const initialCreateState: LeavePolicyCreateState = {
    status: 'idle',
    values: {
        name: '',
        type: 'ANNUAL',
        accrualAmount: '28',
    },
};

function formatPolicyType(value: string): string {
    return value
        .toLowerCase()
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

export function LeavePolicyConfigForm(props: {
    policies: LeavePolicy[];
    policyTypes: readonly string[];
}) {
    const router = useRouter();
    const [createState, createAction, createPending] = useActionState(
        createLeavePolicyAction,
        initialCreateState,
    );
    const formReference = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (!createPending && createState.status === 'success') {
            router.refresh();
            formReference.current?.reset();
        }
    }, [createPending, createState.status, router]);

    const nameError = createState.fieldErrors?.name;
    const typeError = createState.fieldErrors?.type;
    const accrualError = createState.fieldErrors?.accrualAmount;

    const createMessage =
        createState.status === 'error'
            ? createState.message
            : createState.status === 'success'
                ? createState.message
                : null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Leave policies</CardTitle>
                    <CardDescription>Define accrual amounts and approval rules.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        ref={formReference}
                        action={createAction}
                        className="space-y-4"
                        aria-busy={createPending}
                    >
                        <fieldset disabled={createPending} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="leave-policy-name">Policy name</Label>
                                    <Input
                                        id="leave-policy-name"
                                        name="name"
                                        required
                                        key={`leave-policy-name-${createState.values.name}`}
                                        defaultValue={createState.values.name}
                                        aria-invalid={Boolean(nameError)}
                                        aria-describedby={nameError ? 'leave-policy-name-error' : undefined}
                                    />
                                    <FieldError id="leave-policy-name-error" message={nameError} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leave-policy-type">Type</Label>
                                    <Select
                                        name="type"
                                        key={`leave-policy-type-${createState.values.type}`}
                                        defaultValue={createState.values.type}
                                        disabled={createPending}
                                    >
                                        <SelectTrigger
                                            id="leave-policy-type"
                                            aria-invalid={Boolean(typeError)}
                                            aria-describedby={typeError ? 'leave-policy-type-error' : undefined}
                                        >
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {props.policyTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {formatPolicyType(type)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError id="leave-policy-type-error" message={typeError} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="leave-policy-accrual">Annual accrual days</Label>
                                    <Input
                                        id="leave-policy-accrual"
                                        name="accrualAmount"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={366}
                                        step={0.5}
                                        key={`leave-policy-accrual-${createState.values.accrualAmount}`}
                                        defaultValue={createState.values.accrualAmount}
                                        aria-invalid={Boolean(accrualError)}
                                        aria-describedby={accrualError ? 'leave-policy-accrual-error' : undefined}
                                    />
                                    <FieldError id="leave-policy-accrual-error" message={accrualError} />
                                </div>
                                <div className="sm:col-span-2 text-xs text-muted-foreground">
                                    Defaults apply to new balances. Update details after creation for carry over and
                                    compliance rules.
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit" size="sm" disabled={createPending}>
                                {createPending ? <Spinner className="mr-2" /> : null}
                                {createPending ? 'Creating...' : 'Create policy'}
                            </Button>
                            {createMessage ? (
                                <p
                                    className={
                                        createState.status === 'error'
                                            ? 'text-xs text-destructive'
                                            : 'text-xs text-muted-foreground'
                                    }
                                >
                                    {createMessage}
                                </p>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing policies</CardTitle>
                    <CardDescription>Review balances, approvals, and compliance requirements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {props.policies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No leave policies configured yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {props.policies.map((policy) => (
                                <LeavePolicyRow key={policy.id} policy={policy} policyTypes={props.policyTypes} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
