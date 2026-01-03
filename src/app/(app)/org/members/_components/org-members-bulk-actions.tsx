'use client';

import { useActionState, useEffect, useState, useSyncExternalStore } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import type { MemberActionState } from '../actions';
import { bulkMemberAction } from '../actions';

const initialState: MemberActionState = { status: 'idle' };
const SELECTABLE_MEMBER_SELECTOR = '[data-bulk-member="select"]';

interface SelectionSnapshot {
    selected: number;
    total: number;
}

function subscribeToSelectionChanges(onStoreChange: () => void): () => void {
    if (typeof document === 'undefined') {
        return () => undefined;
    }

    const handleChange = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        if (!target.matches(SELECTABLE_MEMBER_SELECTOR)) {
            return;
        }
        onStoreChange();
    };

    document.addEventListener('change', handleChange);
    return () => document.removeEventListener('change', handleChange);
}

function getSelectableMembers(): HTMLInputElement[] {
    if (typeof document === 'undefined') {
        return [];
    }
    return Array.from(document.querySelectorAll<HTMLInputElement>(SELECTABLE_MEMBER_SELECTOR));
}

function getSelectionSnapshot(): SelectionSnapshot {
    const items = getSelectableMembers();
    const selected = items.filter((item) => item.checked).length;
    return { selected, total: items.length };
}

export function OrgMembersBulkActions({
    roleNames,
}: {
    roleNames: string[];
}) {
    const router = useRouter();
    const [state, action, pending] = useActionState(bulkMemberAction, initialState);
    const selection = useSyncExternalStore(
        subscribeToSelectionChanges,
        getSelectionSnapshot,
        () => ({ selected: 0, total: 0 }),
    );
    const [clientMessage, setClientMessage] = useState<string | null>(null);
    const allSelected = selection.total > 0 && selection.selected === selection.total;

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [state.status, router]);

    const visibleClientMessage = state.status === 'idle' ? clientMessage : null;

    const handleToggleAll = (event: ChangeEvent<HTMLInputElement>) => {
        const nextChecked = event.target.checked;
        const items = getSelectableMembers();
        items.forEach((item) => {
            item.checked = nextChecked;
            item.dispatchEvent(new Event('change', { bubbles: true }));
        });
        setClientMessage(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (pending) {
            event.preventDefault();
            return;
        }

        const snapshot = getSelectionSnapshot();
        if (snapshot.selected === 0) {
            setClientMessage('Select at least one member.');
            event.preventDefault();
            return;
        }

        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const intent = submitter instanceof HTMLButtonElement ? submitter.value : null;

        if (!intent) {
            setClientMessage('Select a bulk action.');
            event.preventDefault();
            return;
        }

        const roleField = event.currentTarget.elements.namedItem('roles');
        const selectedRole = roleField instanceof HTMLSelectElement ? roleField.value : '';

        if (intent === 'update-roles' && !selectedRole) {
            setClientMessage('Select a role for bulk updates.');
            event.preventDefault();
            return;
        }

        setClientMessage(null);
    };

    return (
        <form
            id="bulk-members-form"
            action={action}
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3 rounded-xl border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--background)/0.4)] p-4"
        >
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                Bulk actions
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                <label className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAll}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                    Select all on page
                </label>
                <span>
                    {selection.total > 0 ? (
                        <>
                            {selection.selected} of {selection.total} selected
                        </>
                    ) : (
                        'No members on this page'
                    )}
                </span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
                <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    New role
                    <select
                        name="roles"
                        defaultValue=""
                        className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    >
                        <option value="">Select role</option>
                        {roleNames.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="submit"
                        name="intent"
                        value="update-roles"
                        disabled={pending}
                        className="h-9 rounded-md bg-[hsl(var(--primary))] px-3 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-70"
                    >
                        Update roles
                    </button>
                    <button
                        type="submit"
                        name="intent"
                        value="suspend"
                        disabled={pending}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-70"
                    >
                        Suspend
                    </button>
                    <button
                        type="submit"
                        name="intent"
                        value="resume"
                        disabled={pending}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-70"
                    >
                        Resume
                    </button>
                </div>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Select members below to apply bulk updates.
            </p>
            {visibleClientMessage ? (
                <p className="text-xs text-[hsl(var(--destructive))]" role="alert">
                    {visibleClientMessage}
                </p>
            ) : null}
            {state.status !== 'idle' ? (
                <p
                    className={`text-xs ${
                        state.status === 'success'
                            ? 'text-[hsl(var(--primary))]'
                            : 'text-[hsl(var(--destructive))]'
                    }`}
                >
                    {state.message}
                </p>
            ) : null}
        </form>
    );
}
