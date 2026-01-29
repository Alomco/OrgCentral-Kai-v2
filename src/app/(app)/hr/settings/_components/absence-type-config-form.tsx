'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';

import { FieldError } from '../../_components/field-error';
import { createAbsenceTypeAction } from '../absence-type-actions';
import type { AbsenceTypeCreateState } from '../absence-type-actions.types';
import { AbsenceTypeRow } from './absence-type-row';
import { ABSENCE_TYPES_QUERY_KEY, fetchAbsenceTypes } from '../absence-type-query';

const initialCreateState: AbsenceTypeCreateState = {
    status: 'idle',
    values: {
        label: '',
        key: '',
        tracksBalance: true,
        isActive: true,
    },
};

export function AbsenceTypeConfigForm(props: { types: AbsenceTypeConfig[] }) {
    const queryClient = useQueryClient();
    const [createState, createAction, createPending] = useActionState(createAbsenceTypeAction, initialCreateState);
    const { data: types = props.types } = useQuery({
        queryKey: ABSENCE_TYPES_QUERY_KEY,
        queryFn: fetchAbsenceTypes,
        initialData: props.types,
    });
    const formReference = useRef<HTMLFormElement | null>(null);
    const tracksBalanceReference = useRef<HTMLInputElement | null>(null);
    const isActiveReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!createPending && createState.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: ABSENCE_TYPES_QUERY_KEY }).catch(() => null);
            formReference.current?.reset();
        }
    }, [createPending, createState.status, queryClient]);

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
                    <CardTitle>Absence types</CardTitle>
                    <CardDescription>Configure the catalog used in absence reporting.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={formReference} action={createAction} className="space-y-4">
                        <fieldset disabled={createPending} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="absence-type-label">Label</Label>
                                    <Input
                                        id="absence-type-label"
                                        name="label"
                                        required
                                        key={`absence-type-label-${createState.values.label}`}
                                        defaultValue={createState.values.label}
                                        aria-invalid={Boolean(createState.fieldErrors?.label)}
                                        aria-describedby={createState.fieldErrors?.label ? 'absence-type-label-error' : undefined}
                                    />
                                    <FieldError id="absence-type-label-error" message={createState.fieldErrors?.label} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="absence-type-key">Key (optional)</Label>
                                    <Input
                                        id="absence-type-key"
                                        name="key"
                                        placeholder="sick-leave"
                                        key={`absence-type-key-${createState.values.key}`}
                                        defaultValue={createState.values.key}
                                        aria-invalid={Boolean(createState.fieldErrors?.key)}
                                        aria-describedby={createState.fieldErrors?.key ? 'absence-type-key-error' : undefined}
                                    />
                                    <FieldError id="absence-type-key-error" message={createState.fieldErrors?.key} />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank to auto-generate a lower-case key.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="absence-type-tracks">Tracks leave balance</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Adjust balances when absences are approved.
                                        </p>
                                    </div>
                                    <input
                                        ref={tracksBalanceReference}
                                        type="hidden"
                                        name="tracksBalance"
                                        value={createState.values.tracksBalance ? 'on' : 'off'}
                                        key={`absence-type-tracks-${createState.values.tracksBalance ? 'on' : 'off'}`}
                                    />
                                    <Switch
                                        id="absence-type-tracks"
                                        key={`absence-type-tracks-switch-${createState.values.tracksBalance ? 'on' : 'off'}`}
                                        defaultChecked={createState.values.tracksBalance}
                                        onCheckedChange={(checked) => {
                                            if (tracksBalanceReference.current) {
                                                tracksBalanceReference.current.value = checked ? 'on' : 'off';
                                            }
                                        }}
                                        disabled={createPending}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="absence-type-active">Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Hide inactive types from employee reporting.
                                        </p>
                                    </div>
                                    <input
                                        ref={isActiveReference}
                                        type="hidden"
                                        name="isActive"
                                        value={createState.values.isActive ? 'on' : 'off'}
                                        key={`absence-type-active-${createState.values.isActive ? 'on' : 'off'}`}
                                    />
                                    <Switch
                                        id="absence-type-active"
                                        key={`absence-type-active-switch-${createState.values.isActive ? 'on' : 'off'}`}
                                        defaultChecked={createState.values.isActive}
                                        onCheckedChange={(checked) => {
                                            if (isActiveReference.current) {
                                                isActiveReference.current.value = checked ? 'on' : 'off';
                                            }
                                        }}
                                        disabled={createPending}
                                    />
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit" size="sm" disabled={createPending}>
                                {createPending ? <Spinner className="mr-2" /> : null}
                                {createPending ? 'Creating...' : 'Create absence type'}
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
                    <CardTitle>Existing types</CardTitle>
                    <CardDescription>Update labels or toggle active status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {types.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No absence types configured yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {types.map((type) => (
                                <AbsenceTypeRow key={type.id} type={type} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
