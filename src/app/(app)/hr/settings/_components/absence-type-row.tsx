'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';

import { updateAbsenceTypeAction } from '../absence-type-actions';
import type { AbsenceTypeInlineState } from '../absence-type-actions.types';

const initialInlineState: AbsenceTypeInlineState = { status: 'idle' };

export function AbsenceTypeRow(props: { type: AbsenceTypeConfig }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(updateAbsenceTypeAction, initialInlineState);
    const tracksBalanceReference = useRef<HTMLInputElement | null>(null);
    const isActiveReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    const message = state.status === 'idle' ? null : state.message;

    return (
        <form action={action} className="space-y-2 rounded-lg border p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_auto_auto_auto] sm:items-center">
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

                <div className="space-y-1">
                    <Label>Key</Label>
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground">
                        {props.type.key}
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                        disabled={pending}
                    />
                    <Label htmlFor={`absence-type-tracks-${props.type.id}`} className="text-xs text-muted-foreground">
                        Tracks balance
                    </Label>
                </div>

                <div className="flex items-center gap-2">
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
                        disabled={pending}
                    />
                    <Label htmlFor={`absence-type-active-${props.type.id}`} className="text-xs text-muted-foreground">
                        Active
                    </Label>
                </div>

                <div className="flex items-center justify-start sm:justify-end">
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
