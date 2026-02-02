'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { updateTenantStatusAction, type TenantStatusActionState } from '../actions';

const initialState: TenantStatusActionState = { status: 'idle' };

export function TenantStatusAction(props: {
    tenantId: string;
    action: 'SUSPEND' | 'RESTORE' | 'ARCHIVE';
    breakGlassRequired?: boolean;
}) {
    const [state, formAction, pending] = useActionState(updateTenantStatusAction, initialState);
    const statusReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (state.status !== 'idle') {
            statusReference.current?.focus();
        }
    }, [state.status]);

    return (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="tenantId" value={props.tenantId} />
            <input type="hidden" name="action" value={props.action} />
            {props.breakGlassRequired ? (
                <Input
                    name="breakGlassApprovalId"
                    placeholder="Break-glass approval ID"
                    className="h-8 w-44"
                    disabled={pending}
                    required
                />
            ) : null}
            <Button type="submit" size="sm" variant={props.action === 'RESTORE' ? 'default' : 'outline'} disabled={pending}>
                {props.action === 'RESTORE' ? 'Restore' : props.action === 'SUSPEND' ? 'Suspend' : 'Archive'}
            </Button>
            {state.status !== 'idle' ? (
                <Alert ref={statusReference} tabIndex={-1} className="mt-2 w-full">
                    <AlertTitle>
                        {state.status === 'success' ? 'Updated' : 'Failed'}
                    </AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
