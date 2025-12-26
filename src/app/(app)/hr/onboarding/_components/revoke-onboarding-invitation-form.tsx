'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { revokeOnboardingInvitationAction } from '../actions';
import { buildInitialOnboardingRevokeInviteFormState } from '../form-state';

export interface RevokeOnboardingInvitationFormProps {
    token: string;
}

export function RevokeOnboardingInvitationForm({ token }: RevokeOnboardingInvitationFormProps) {
    const [state, action, pending] = useActionState(
        revokeOnboardingInvitationAction,
        buildInitialOnboardingRevokeInviteFormState({ token }),
    );

    const [confirmOpen, setConfirmOpen] = useState(false);

    const formReference = useRef<HTMLFormElement | null>(null);

    const feedbackReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={action} className="inline-flex flex-col items-end gap-1" aria-busy={pending}>
            <input type="hidden" name="token" value={token} />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Revoking…' : 'Revoke'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will invalidate the invitation token and prevent it from being used.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={() => {
                                setConfirmOpen(false);
                                formReference.current?.requestSubmit();
                            }}
                        >
                            {pending ? <Spinner className="mr-2" /> : null}
                            {pending ? 'Revoking…' : 'Revoke invite'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {state.status === 'error' ? (
                <div
                    ref={feedbackReference}
                    tabIndex={-1}
                    className="text-xs text-destructive"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {state.message ?? 'Unable to revoke invitation.'}
                </div>
            ) : null}
        </form>
    );
}
