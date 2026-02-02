'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { stopImpersonationAction, type ImpersonationActionState } from '../actions';

const initialState: ImpersonationActionState = { status: 'idle' };

export function StopImpersonationForm({ sessionId }: { sessionId: string }) {
    const [state, formAction, pending] = useActionState(stopImpersonationAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="sessionId" value={sessionId} />
            <Input name="reason" placeholder="Reason" className="h-8" disabled={pending} />
            <Button size="sm" type="submit" variant="outline" disabled={pending}>Stop</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
