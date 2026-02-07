'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';

import { stopImpersonationAction, type ImpersonationActionState } from '../actions';

const initialState: ImpersonationActionState = { status: 'idle' };

export function StopImpersonationForm({ sessionId }: { sessionId: string }) {
    const [state, formAction, pending] = useActionState(stopImpersonationAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Stop session</span>
                <InfoButton
                    label="Stop impersonation"
                    sections={[
                        { label: 'What', text: 'End an active session.' },
                        { label: 'Prereqs', text: 'Session must be ACTIVE.' },
                        { label: 'Next', text: 'Document the outcome in the ticket.' },
                        { label: 'Compliance', text: 'Stops are audited.' },
                    ]}
                />
            </div>
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
