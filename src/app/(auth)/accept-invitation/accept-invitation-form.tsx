'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
    acceptInvitationAction,
} from './actions';
import {
    initialAcceptInvitationState,
    type AcceptInvitationActionState,
} from './accept-invitation.state';

export interface AcceptInvitationFormProps {
    token: string;
    organizationName: string;
    targetEmail: string;
    roles?: string[];
}

export function AcceptInvitationForm({
    token,
    organizationName,
    targetEmail,
    roles,
}: AcceptInvitationFormProps) {
    const [state, action, pending] = useActionState<AcceptInvitationActionState, FormData>(
        acceptInvitationAction,
        initialAcceptInvitationState,
    );

    const roleList = roles?.filter((role) => role.trim().length > 0) ?? [];
    const showSuccess = state.status === 'success';

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="rounded-2xl border border-border bg-card/70 p-4 text-left text-sm text-muted-foreground shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Invitation details</p>
                <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Organization</span>
                        <span className="font-semibold text-foreground">{organizationName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Invited email</span>
                        <span className="font-medium text-foreground">{targetEmail}</span>
                    </div>
                    {roleList.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium text-foreground">{roleList[0]}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {state.status === 'error' ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    {state.message}
                </p>
            ) : null}

            {showSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <p className="font-semibold">Invitation accepted.</p>
                    <p className="text-xs opacity-80">
                        {state.alreadyMember
                            ? 'You already have access to this workspace.'
                            : 'Your access is ready. Continue to your workspace.'}
                    </p>
                </div>
            ) : null}

            <div className="flex flex-col gap-2">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={pending || showSuccess}
                >
                    {pending ? 'Accepting...' : showSuccess ? 'Accepted' : 'Accept invitation'}
                </Button>
                {showSuccess ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/api/auth/post-login">Continue to workspace</Link>
                    </Button>
                ) : null}
            </div>
        </form>
    );
}
