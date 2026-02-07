'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { InfoButton } from '@/components/ui/info-button';

export interface InvitePolicyState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    open: boolean;
}

export const initialInvitePolicyState: InvitePolicyState = {
    status: 'idle',
    open: false,
};

export function InvitePolicyForm({
    action,
    defaultOpen,
}: {
    action: (state: InvitePolicyState, formData: FormData) => Promise<InvitePolicyState>;
    defaultOpen: boolean;
}) {
    const [state, formAction] = useActionState(action, { ...initialInvitePolicyState, open: defaultOpen });

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Allow invite links</p>
                        <InfoButton
                            label="Invite links"
                            sections={[
                                { label: 'What', text: 'Create shareable links for self-serve invites.' },
                                { label: 'Prereqs', text: 'Admins can revoke links at any time.' },
                                { label: 'Next', text: 'Rotate links if shared outside the org.' },
                                { label: 'Compliance', text: 'Invite creation is logged.' },
                            ]}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        When enabled, admins can share invite links without pre-approving emails.
                    </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center rounded-full focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background">
                    <input
                        type="checkbox"
                        name="invite-open"
                        key={state.open ? 'open' : 'closed'}
                        defaultChecked={state.open}
                        aria-label="Allow invite links"
                        className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                </label>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                <span>{state.status === 'success' ? state.message ?? 'Saved' : 'Changes apply immediately'}</span>
            </div>
            <Button type="submit" size="sm" className="px-4">
                Save
            </Button>
            {state.status === 'error' ? (
                <p className="text-xs text-destructive" role="alert">
                    {state.message ?? 'Unable to save'}
                </p>
            ) : null}
        </form>
    );
}
