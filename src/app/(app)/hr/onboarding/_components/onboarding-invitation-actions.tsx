'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { resendOnboardingInvitationAction } from '../actions';
import type { ResendOnboardingInvitationActionState } from '../actions/onboarding-invitations.types';
import { RevokeOnboardingInvitationForm } from './revoke-onboarding-invitation-form';

interface OnboardingInvitationActionsProps {
    token: string;
    email: string;
}

const initialState: ResendOnboardingInvitationActionState = { status: 'idle' };

function buildInviteLink(token: string, invitationUrl?: string): string {
    if (invitationUrl) {
        return invitationUrl;
    }
    const path = `/accept-invitation?token=${encodeURIComponent(token)}`;
    if (typeof window === 'undefined') {
        return path;
    }
    return `${window.location.origin}${path}`;
}

export function OnboardingInvitationActions({ token, email }: OnboardingInvitationActionsProps) {
    const resendAction = async (
        previous: ResendOnboardingInvitationActionState,
        formData: FormData,
    ): Promise<ResendOnboardingInvitationActionState> => {
        try {
            return await resendOnboardingInvitationAction(previous, formData);
        } catch {
            return { status: 'error', message: 'Unable to resend invitation. Check your connection and try again.' };
        }
    };

    const [state, action, pending] = useActionState(resendAction, initialState);
    const formReference = useRef<HTMLFormElement | null>(null);
    const wasPending = useRef(false);
    const [revokePending, setRevokePending] = useState(false);
    const [revoked, setRevoked] = useState(false);

    const invitationUrl = state.status === 'success' ? state.invitationUrl : undefined;
    const actionsDisabled = pending || revokePending || revoked;

    const copyInviteLink = useCallback(
        (override?: string) => {
            const link = override ?? buildInviteLink(token, invitationUrl);
            navigator.clipboard
                .writeText(link)
                .then(() => {
                    toast.success('Invite link copied.');
                })
                .catch(() => {
                    toast.error('Unable to copy invite link.');
                });
        },
        [token, invitationUrl],
    );

    useEffect(() => {
        if (wasPending.current && !pending && state.status === 'success') {
            toast.success('Invitation email resent.', {
                description: `Sent to ${email}.`,
                action: {
                    label: 'Copy invite link',
                    onClick: () => {
                        copyInviteLink(invitationUrl);
                    },
                },
            });
        }
        wasPending.current = pending;
    }, [pending, state.status, invitationUrl, email, copyInviteLink]);

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <form ref={formReference} action={action} className="inline-flex" aria-busy={pending}>
                    <input type="hidden" name="token" value={token} />
                    <Button type="submit" variant="outline" size="sm" disabled={actionsDisabled}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Resending...' : 'Resend email'}
                    </Button>
                </form>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actionsDisabled}
                    onClick={() => {
                        copyInviteLink();
                    }}
                >
                    <Copy className="h-4 w-4" />
                    Copy invite link
                </Button>
                <RevokeOnboardingInvitationForm
                    token={token}
                    disabled={actionsDisabled}
                    onPendingChange={setRevokePending}
                    onStatusChange={(status) => {
                        if (status === 'success') {
                            setRevoked(true);
                        }
                    }}
                />
            </div>
            {state.status === 'error' && !revoked ? (
                <div
                    className="flex items-center gap-2 text-xs text-destructive"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <span>{state.message}</span>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        disabled={actionsDisabled}
                        className="h-auto p-0 text-destructive"
                        onClick={() => {
                            formReference.current?.requestSubmit();
                        }}
                    >
                        Try again
                    </Button>
                </div>
            ) : null}
            {revoked ? (
                <div className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    Invitation revoked.
                </div>
            ) : null}
        </div>
    );
}
