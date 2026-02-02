'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';

import { updateAbsenceTypeAction } from '../absence-type-actions';
import type { AbsenceTypeInlineState } from '../absence-type-actions.types';
import { ABSENCE_TYPES_QUERY_KEY } from '../absence-type-query';

const initialInlineState: AbsenceTypeInlineState = { status: 'idle' };

export function AbsenceTypeRow(props: { type: AbsenceTypeConfig }) {
    const queryClient = useQueryClient();
    const [state, action, pending] = useActionState(updateAbsenceTypeAction, initialInlineState);
    const tracksBalanceReference = useRef<HTMLInputElement | null>(null);
    const isActiveReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: ABSENCE_TYPES_QUERY_KEY }).catch(() => null);
        }
    }, [queryClient, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-2 rounded-lg border p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_auto_auto_auto] lg:items-center">
                <input type="hidden" name="typeId" value={props.type.id} />

                <div className="space-y-1">
                    <Label htmlFor={`absence-type-label-${props.type.id}`}>Label</Label>
                    <Input
                        id={`absence-type-label-${props.type.id}`}
                        name="label"
                        defaultValue={props.type.label}
                        disabled={pending}
                    />
                </div>

                <div className="space-y-1 min-w-0">
                    <Label>Key</Label>
                    <div
                        className="rounded-md border bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground truncate"
                        title={props.type.key}
                    >
                        {props.type.key}
                    </div>
                    <p className="text-xs text-muted-foreground">Auto-generated ID used in reports.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={tracksBalanceReference}
                        type="hidden"
                        name="tracksBalance"
                        value={props.type.tracksBalance ? 'on' : 'off'}
                        key={`absence-type-row-tracks-${props.type.id}-${props.type.tracksBalance ? 'on' : 'off'}`}
                    />
                    <Switch
                        id={`absence-type-tracks-${props.type.id}`}
                        key={`absence-type-row-tracks-switch-${props.type.id}-${props.type.tracksBalance ? 'on' : 'off'}`}
                        defaultChecked={props.type.tracksBalance}
                        onCheckedChange={(checked) => {
                            if (tracksBalanceReference.current) {
                                tracksBalanceReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        aria-describedby={`absence-type-tracks-help-${props.type.id}`}
                        disabled={pending}
                    />
                    <Label htmlFor={`absence-type-tracks-${props.type.id}`} className="text-xs text-muted-foreground">
                        Tracks balance
                    </Label>
                    <span id={`absence-type-tracks-help-${props.type.id}`} className="sr-only">Toggle whether this absence type affects balances.</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={isActiveReference}
                        type="hidden"
                        name="isActive"
                        value={props.type.isActive ? 'on' : 'off'}
                        key={`absence-type-row-active-${props.type.id}-${props.type.isActive ? 'on' : 'off'}`}
                    />
                    <Switch
                        id={`absence-type-active-${props.type.id}`}
                        key={`absence-type-row-active-switch-${props.type.id}-${props.type.isActive ? 'on' : 'off'}`}
                        defaultChecked={props.type.isActive}
                        onCheckedChange={(checked) => {
                            if (isActiveReference.current) {
                                isActiveReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        aria-describedby={`absence-type-active-help-${props.type.id}`}
                        disabled={pending}
                    />
                    <Label htmlFor={`absence-type-active-${props.type.id}`} className="text-xs text-muted-foreground">
                        Active
                    </Label>
                    <span id={`absence-type-active-help-${props.type.id}`} className="sr-only">Toggle whether this absence type can be used by employees.</span>
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            {message ? (
                <p className={state.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                    {message}
                </p>
            ) : null}
        </form>
    );
}
