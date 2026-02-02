'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { updateSupportTicketAction, type SupportTicketActionState } from '../actions';

const initialState: SupportTicketActionState = { status: 'idle' };

export function SupportTicketUpdateForm({ ticketId, status }: { ticketId: string; status: string }) {
    const [state, formAction, pending] = useActionState(updateSupportTicketAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="ticketId" value={ticketId} />
            <Input name="status" defaultValue={status} className="h-8" disabled={pending} />
            <Input name="assignedTo" placeholder="Assignee user ID" className="h-8" disabled={pending} />
            <Button size="sm" type="submit" disabled={pending}>Update</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
