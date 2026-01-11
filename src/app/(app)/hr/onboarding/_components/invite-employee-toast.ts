'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { OnboardingInviteFormState } from '../form-state';

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

function copyInviteLink(token: string, invitationUrl?: string): void {
    const link = buildInviteLink(token, invitationUrl);
    navigator.clipboard
        .writeText(link)
        .then(() => {
            toast.success('Invite link copied.');
        })
        .catch(() => {
            toast.error('Unable to copy invite link.');
        });
}

export function useInviteEmployeeToast(state: OnboardingInviteFormState, pending: boolean): void {
    const wasPending = useRef(false);

    useEffect(() => {
        if (wasPending.current && !pending && state.status === 'success' && state.token) {
            const token = state.token;
            const invitationUrl = state.invitationUrl;
            const emailDelivered = state.emailDelivered ?? false;
            toast.success(emailDelivered ? 'Invitation delivered.' : 'Invitation created.', {
                description: emailDelivered
                    ? 'Email delivery succeeded.'
                    : 'Email delivery failed. Copy the invite link to share manually.',
                action: {
                    label: 'Copy invite link',
                    onClick: () => {
                        copyInviteLink(token, invitationUrl);
                    },
                },
            });
        }
        wasPending.current = pending;
    }, [pending, state.status, state.token, state.invitationUrl, state.emailDelivered]);
}
