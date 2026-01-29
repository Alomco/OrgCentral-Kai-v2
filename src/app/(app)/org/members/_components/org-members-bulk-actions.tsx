'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { memberKeys, updateMember } from './members.api';

const SELECTABLE_MEMBER_SELECTOR = '[data-bulk-member="select"]';
const ROLE_SELECTOR = 'select[name="roles"]';

interface SelectionSnapshot { selected: number; total: number }
let cachedSelectionSnapshot: SelectionSnapshot = { selected: 0, total: 0 };

function subscribeToSelectionChanges(onStoreChange: () => void): () => void {
    const handleChange = (event: Event) => {
        const target = event.target as HTMLElement | null;
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
    return Array.from(document.querySelectorAll<HTMLInputElement>(SELECTABLE_MEMBER_SELECTOR));
}

function getSelectionSnapshot(): SelectionSnapshot {
    const items = getSelectableMembers();
    const selected = items.filter((item) => item.checked).length;
    const total = items.length;
    if (cachedSelectionSnapshot.selected === selected && cachedSelectionSnapshot.total === total) {
        return cachedSelectionSnapshot;
    }
    cachedSelectionSnapshot = { selected, total };
    return cachedSelectionSnapshot;
}

type BulkIntent = 'update-roles' | 'suspend' | 'resume';
const BULK_INTENT_UPDATE_ROLES: BulkIntent = 'update-roles';
const BULK_INTENT_SUSPEND: BulkIntent = 'suspend';
const BULK_INTENT_RESUME: BulkIntent = 'resume';

function getBulkErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unable to update members.';
}

export function OrgMembersBulkActions({ roleNames, orgId, currentQueryKey }: { roleNames: string[]; orgId: string; currentQueryKey?: string }) {
    const queryClient = useQueryClient();
    const selection = useSyncExternalStore(
        subscribeToSelectionChanges,
        getSelectionSnapshot,
        () => ({ selected: 0, total: 0 }),
    );
    const [clientMessage, setClientMessage] = useState<string | null>(null);
    const allSelected = selection.total > 0 && selection.selected === selection.total;

    const bulk = useMutation({
        mutationFn: async (payload: { intent: BulkIntent; role?: string }): Promise<undefined> => {
            const items = getSelectableMembers().filter((item) => item.checked);
            const userIds = items.map((item) => item.value);
            if (userIds.length === 0) {
                throw new Error('Select at least one member.');
            }

            const tasks = userIds.map((userId) => {
                if (payload.intent === BULK_INTENT_UPDATE_ROLES) {
                    return updateMember(orgId, userId, { roles: payload.role ? [payload.role] : [] });
                }
                return updateMember(
                    orgId,
                    userId,
                    { status: payload.intent === BULK_INTENT_SUSPEND ? 'SUSPENDED' : 'ACTIVE' },
                );
            });
            await Promise.all(tasks);
            return undefined;
        },
        onSuccess: async () => {
            if (currentQueryKey) {
                await queryClient.invalidateQueries({ queryKey: memberKeys.list(orgId, currentQueryKey) });
            }
        },
    });

    const handleToggleAll = (event: ChangeEvent<HTMLInputElement>) => {
        const nextChecked = event.target.checked;
        getSelectableMembers().forEach((item) => {
            item.checked = nextChecked;
            item.dispatchEvent(new Event('change', { bubbles: true }));
        });
        setClientMessage(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (bulk.isPending) {
            event.preventDefault();
            return;
        }

        const submitEvent = event.nativeEvent as SubmitEvent;
        const submitter = submitEvent.submitter instanceof HTMLButtonElement
            ? submitEvent.submitter
            : null;
        const intent = submitter?.value as BulkIntent | undefined;
        if (!intent) {
            setClientMessage('Select a bulk action.');
            event.preventDefault();
            return;
        }

        const roleField = event.currentTarget.elements.namedItem('roles');
        const selectedRole = roleField instanceof HTMLSelectElement ? roleField.value : '';
        if (intent === BULK_INTENT_UPDATE_ROLES && !selectedRole) {
            setClientMessage('Select a role for bulk updates.');
            event.preventDefault();
            return;
        }

        setClientMessage(null);
        // submit handled by action attribute
    };

    return (
        <form
            id="bulk-members-form"
            action={() => bulk.mutate({ intent: BULK_INTENT_UPDATE_ROLES })}
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3 rounded-xl border border-[oklch(var(--border)/0.6)] bg-[oklch(var(--background)/0.4)] p-4"
        >
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[oklch(var(--muted-foreground))]">Bulk actions</div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[oklch(var(--muted-foreground))]">
                <label className="flex items-center gap-2 text-xs font-medium text-[oklch(var(--muted-foreground))]">
                    <input type="checkbox" checked={allSelected} onChange={handleToggleAll} className="h-4 w-4 rounded border-[oklch(var(--border))] text-[oklch(var(--primary))]" />
                    Select all on page
                </label>
                <span>{selection.total > 0 ? (<>{selection.selected} of {selection.total} selected</>) : ('No members on this page')}</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
                <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[oklch(var(--muted-foreground))]">
                    New role
                    <select name="roles" defaultValue="" className="h-9 w-full rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm text-[oklch(var(--foreground))]">
                        <option value="">Select role</option>
                        {roleNames.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </label>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => {
                        const select = document.querySelector<HTMLSelectElement>(ROLE_SELECTOR);
                        const role = select?.value ?? '';
                        bulk.mutate({ intent: BULK_INTENT_UPDATE_ROLES, role });
                    }} disabled={bulk.isPending} className="h-9 rounded-md bg-[oklch(var(--primary))] px-3 text-sm font-medium text-[oklch(var(--primary-foreground))] disabled:opacity-70">Update roles</button>
                    <button type="button" onClick={() => bulk.mutate({ intent: BULK_INTENT_SUSPEND })} disabled={bulk.isPending} className="h-9 rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70">Suspend</button>
                    <button type="button" onClick={() => bulk.mutate({ intent: BULK_INTENT_RESUME })} disabled={bulk.isPending} className="h-9 rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70">Resume</button>
                </div>
            </div>
            <p className="text-xs text-[oklch(var(--muted-foreground))]">Select members below to apply bulk updates.</p>
            {clientMessage ? (<p className="text-xs text-[oklch(var(--destructive))]" role="alert">{clientMessage}</p>) : null}
            {bulk.isError ? (
                <p className="text-xs text-[oklch(var(--destructive))]">{getBulkErrorMessage(bulk.error)}</p>
            ) : null}
            {bulk.isSuccess ? (<p className="text-xs text-[oklch(var(--primary))]">Updated</p>) : null}
        </form>
    );
}

