'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { approveImpersonationAction, type ImpersonationActionState } from '../actions';

const initialState: ImpersonationActionState = { status: 'idle' };

export function ApproveImpersonationForm({ requestId }: { requestId: string }) {
    const [state, formAction, pending] = useActionState(approveImpersonationAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="requestId" value={requestId} />
            <Input name="requestIdDisplay" defaultValue={requestId} readOnly className="h-8" />
            <Button size="sm" type="submit" disabled={pending}>Approve</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
