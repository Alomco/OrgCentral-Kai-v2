'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { roleKeys } from './roles.api';
import { deleteRoleInlineAction, updateRoleInlineAction } from '../actions';
import type { InlineRoleActionState } from '../actions.state';

export function RoleEditor(props: {
  orgId: string;
  roleId: string;
  initialName: string;
  initialDescription: string;
  initialPermissionsText: string;
}) {
  const queryClient = useQueryClient();
  const [updateState, updateAction, updatePending] = useActionState<InlineRoleActionState, FormData>(
    updateRoleInlineAction,
    { status: 'idle' },
  );
  const [deleteState, deleteAction, deletePending] = useActionState<InlineRoleActionState, FormData>(
    deleteRoleInlineAction,
    { status: 'idle' },
  );

  useEffect(() => {
    if (updateState.status === 'success') {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: roleKeys.list(props.orgId) }),
        queryClient.invalidateQueries({ queryKey: roleKeys.detail(props.orgId, props.roleId) }),
      ]).catch(() => null);
    }
  }, [props.orgId, props.roleId, queryClient, updateState.status]);

  useEffect(() => {
    if (deleteState.status === 'success') {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(props.orgId) }).catch(() => null);
    }
  }, [props.orgId, queryClient, deleteState.status]);

  const message =
    deleteState.status !== 'idle'
      ? deleteState.message
      : updateState.status !== 'idle'
        ? updateState.message
        : null;

  const messageTone =
    deleteState.status === 'error' || updateState.status === 'error'
      ? 'text-xs text-destructive'
      : 'text-xs text-muted-foreground';

  const disabled = useMemo(() => updatePending || deletePending, [updatePending, deletePending]);

  return (
    <div className="mt-3 grid gap-3">
      <form action={updateAction} className="grid gap-2" aria-busy={updatePending}>
        <input type="hidden" name="roleId" value={props.roleId} />
        <label className="grid gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Name</span>
          <input
            name="name"
            defaultValue={props.initialName}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Description</span>
          <input
            name="description"
            defaultValue={props.initialDescription}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] text-muted-foreground">Permissions</span>
          <textarea
            name="permissionsText"
            defaultValue={props.initialPermissionsText}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <span className="text-[11px] text-muted-foreground">
            One per line: <span className="font-mono">resource: perm1,perm2</span>
          </span>
        </label>

        {message ? <p className={messageTone}>{message}</p> : null}

        <button type="submit" disabled={disabled} className="h-9 w-fit rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-70">
          Save changes
        </button>
      </form>

      <form action={deleteAction} aria-busy={deletePending}>
        <input type="hidden" name="roleId" value={props.roleId} />
        <button
          type="submit"
          disabled={deletePending}
          className="h-9 w-fit rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground disabled:opacity-70"
        >
          Delete role
        </button>
      </form>
    </div>
  );
}
