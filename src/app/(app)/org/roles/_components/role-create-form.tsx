'use client';

import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { roleKeys } from './roles.api';
import { createRoleAction } from '../actions';
import { initialRoleCreateState } from '../actions.state';

export function RoleCreateForm({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [state, formAction, pending] = useActionState(createRoleAction, initialRoleCreateState);

  useEffect(() => {
    if (state.status === 'success') {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(orgId) }).catch(() => null);
    }
  }, [orgId, queryClient, state.status]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl bg-card/60 p-6 backdrop-blur"
      aria-busy={pending}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Create role</p>
        <p className="text-xs text-muted-foreground">Add a custom role for your organization.</p>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <Input name="name" placeholder="Role name" required />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <Textarea name="description" placeholder="Optional" rows={3} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" className="px-4" disabled={pending}>
          Create
        </Button>
        {state.status !== 'idle' ? (
          <p className={state.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            {state.message ?? (state.status === 'error' ? 'Unable to create role' : 'Role created.')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
