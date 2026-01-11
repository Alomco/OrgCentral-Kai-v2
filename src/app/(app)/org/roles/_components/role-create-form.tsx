'use client';

import { useActionState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createRoleAction } from '../actions';
import { initialRoleCreateState, type RoleCreateState } from '../actions.state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function RoleCreateForm() {
    const router = useRouter();
    const [state, formAction] = useActionState<RoleCreateState, FormData>(createRoleAction, initialRoleCreateState);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.6)] p-6 backdrop-blur">
            <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Create role</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Add a custom role for your organization.</p>
            </div>

            <div className="grid gap-3">
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</span>
                    <Input name="name" placeholder="Role name" required />
                </label>

                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Description</span>
                    <Textarea name="description" placeholder="Optional" rows={3} />
                </label>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" size="sm" className="px-4">
                    Create
                </Button>
                {state.status === 'success' ? (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{state.message ?? 'Saved'}</p>
                ) : null}
            </div>

            {state.status === 'error' ? (
                <p className="text-xs text-red-500" role="alert">
                    {state.message ?? 'Unable to create role'}
                </p>
            ) : null}
        </form>
    );
}
