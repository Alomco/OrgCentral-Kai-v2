'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { InlineRoleActionState } from '../actions.state';
import { deleteRoleInlineAction, updateRoleInlineAction } from '../actions';

const initialState: InlineRoleActionState = { status: 'idle' };

export function RoleEditor(props: {
    roleId: string;
    initialName: string;
    initialDescription: string;
    initialPermissionsText: string;
}) {
    const router = useRouter();

    const [updateState, updateAction, updatePending] = useActionState<InlineRoleActionState, FormData>(
        updateRoleInlineAction,
        initialState,
    );
    const [deleteState, deleteAction, deletePending] = useActionState<InlineRoleActionState, FormData>(
        deleteRoleInlineAction,
        initialState,
    );

    useEffect(() => {
        if (updateState.status === 'success' || deleteState.status === 'success') {
            router.refresh();
        }
    }, [deleteState.status, router, updateState.status]);

    const message =
        updateState.status !== 'idle'
            ? updateState
            : deleteState.status !== 'idle'
                ? deleteState
                : null;

    return (
        <div className="mt-3 grid gap-3">
            <form action={updateAction} className="grid gap-2">
                <input type="hidden" name="roleId" value={props.roleId} />
                <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Name</span>
                    <input
                        name="name"
                        defaultValue={props.initialName}
                        className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Description</span>
                    <input
                        name="description"
                        defaultValue={props.initialDescription}
                        className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Permissions</span>
                    <textarea
                        name="permissionsText"
                        defaultValue={props.initialPermissionsText}
                        rows={4}
                        className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                    />
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        One per line: <span className="font-mono">resource: perm1,perm2</span>
                    </span>
                </label>

                {message ? (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{message.message}</p>
                ) : null}

                <button
                    type="submit"
                    disabled={updatePending}
                    className="h-9 w-fit rounded-md bg-[hsl(var(--primary))] px-3 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-70"
                >
                    Save changes
                </button>
            </form>

            <form action={deleteAction}>
                <input type="hidden" name="roleId" value={props.roleId} />
                <button
                    type="submit"
                    disabled={deletePending}
                    className="h-9 w-fit rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-70"
                >
                    Delete role
                </button>
            </form>
        </div>
    );
}
