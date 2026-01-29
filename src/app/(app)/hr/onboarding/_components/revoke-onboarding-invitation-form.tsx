'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import {
    buildInitialOnboardingRevokeInviteFormState,
    type OnboardingRevokeInviteFormState,
    type OnboardingRevokeInviteFormStatus,
} from '../form-state';
import { ONBOARDING_INVITATIONS_QUERY_KEY } from '../onboarding-invitations-query';

export interface RevokeOnboardingInvitationFormProps {
    token: string;
    disabled?: boolean;
    onPendingChange?: (pending: boolean) => void;
    onStatusChange?: (status: OnboardingRevokeInviteFormStatus) => void;
}

export function RevokeOnboardingInvitationForm({
    token,
    disabled = false,
    onPendingChange,
    onStatusChange,
}: RevokeOnboardingInvitationFormProps) {
    const queryClient = useQueryClient();
    const revokeAction = async (
        previousState: OnboardingRevokeInviteFormState,
        formData: FormData,
    ): Promise<OnboardingRevokeInviteFormState> => {
        try {
            return await revokeOnboardingInvitationAction(previousState, formData);
        } catch {
            return {
                status: 'error',
                message: 'Unable to revoke invitation.',
                values: previousState.values,
            };
        }
    };

    const [state, action, pending] = useActionState(
        revokeAction,
        buildInitialOnboardingRevokeInviteFormState({ token }),
    );

    const [confirmOpen, setConfirmOpen] = useState(false);

    const formReference = useRef<HTMLFormElement | null>(null);

    const feedbackReference = useRef<HTMLDivElement | null>(null);
    const isDisabled = disabled || pending || state.status === 'success';
    const previousStatus = useRef(state.status);

    useEffect(() => {
        onPendingChange?.(pending);
    }, [pending, onPendingChange]);

    useEffect(() => {
        const priorStatus = previousStatus.current;
        if (!pending && state.status === 'error' && priorStatus !== 'error') {
            feedbackReference.current?.focus();
        }
        if (!pending && state.status === 'success' && priorStatus !== 'success') {
            toast.success('Invitation revoked.');
            void queryClient.invalidateQueries({ queryKey: ONBOARDING_INVITATIONS_QUERY_KEY }).catch(() => null);
        }
        if (priorStatus !== state.status) {
            onStatusChange?.(state.status);
        }
        previousStatus.current = state.status;
    }, [pending, state.status, onStatusChange, queryClient]);

    return (
        <form ref={formReference} action={action} className="inline-flex flex-col items-end gap-1" aria-busy={pending}>
            <input type="hidden" name="token" value={token} />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" disabled={isDisabled}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Revoking...' : 'Revoke'}
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
                        <AlertDialogCancel disabled={isDisabled}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDisabled}
                            onClick={() => {
                                setConfirmOpen(false);
                                formReference.current?.requestSubmit();
                            }}
                        >
                            {pending ? <Spinner className="mr-2" /> : null}
                            {pending ? 'Revoking...' : 'Revoke invite'}
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
            {state.status === 'success' ? (
                <div className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    Invitation revoked.
                </div>
            ) : null}
        </form>
    );
}
