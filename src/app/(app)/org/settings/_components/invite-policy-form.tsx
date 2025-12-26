'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

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
        <form action={formAction} className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.12)] p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Allow invite links</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        When enabled, admins can share invite links without pre-approving emails.
                    </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                    <input
                        type="checkbox"
                        name="invite-open"
                        key={state.open ? 'open' : 'closed'}
                        defaultChecked={state.open}
                        aria-label="Allow invite links"
                        className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-[hsl(var(--muted))] transition motion-reduce:transition-none peer-checked:bg-[hsl(var(--primary))]" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition motion-reduce:transition-none peer-checked:translate-x-5" />
                </label>
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                <span>{state.status === 'success' ? state.message ?? 'Saved' : 'Changes apply immediately'}</span>
            </div>
            <Button type="submit" size="sm" className="px-4">
                Save
            </Button>
            {state.status === 'error' ? (
                <p className="text-xs text-red-500" role="alert">
                    {state.message ?? 'Unable to save'}
                </p>
            ) : null}
        </form>
    );
}
