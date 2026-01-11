'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { resendOrgInvitationAction } from '../actions/resend-invitation';
import type { ResendOrgInvitationActionState } from '../actions/invitation-actions.types';

const initialState: ResendOrgInvitationActionState = { status: 'idle' };

export function ResendOrgInvitationForm({ token }: { token: string }) {
    const [state, action, pending] = useActionState(resendOrgInvitationAction, initialState);

    return (
        <form action={action} className="inline-flex flex-col items-end gap-1" aria-busy={pending}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
                {pending ? <Spinner className="mr-2" /> : null}
                {pending ? 'Resending...' : 'Resend'}
            </Button>
            {state.status === 'error' ? (
                <span className="text-xs text-destructive">{state.message}</span>
            ) : null}
        </form>
    );
}
