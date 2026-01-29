'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MembershipStatus } from '@prisma/client';

import { updateMember, memberKeys } from './members.api';
import { membersSearchKey } from './members.api';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function MemberActions(props: { orgId: string; userId: string; initialRoles: string; status: MembershipStatus; currentQueryKey?: string }) {
    const queryClient = useQueryClient();

    const updateRoles = useMutation({
        mutationFn: async (form: FormData): Promise<undefined> => {
            const roles = readFormString(form, 'roles')
                .split(',')
                .map((role) => role.trim())
                .filter(Boolean);
            await updateMember(props.orgId, props.userId, { roles });
            return undefined;
        },
        onSuccess: async () => {
            if (props.currentQueryKey) {
                await queryClient.invalidateQueries({ queryKey: memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))) });
            }
        },
    });

    const suspend = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'SUSPENDED' });
            return undefined;
        },
        onSuccess: async () => {
            if (props.currentQueryKey) {
                await queryClient.invalidateQueries({ queryKey: memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))) });
            }
        },
    });

    const resume = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'ACTIVE' });
            return undefined;
        },
        onSuccess: async () => {
            if (props.currentQueryKey) {
                await queryClient.invalidateQueries({ queryKey: memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))) });
            }
        },
    });

    const canSuspend = props.status === 'ACTIVE';
    const canResume = props.status === 'SUSPENDED';

    const removeFromOrg = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'SUSPENDED' as any });
            return undefined;
        },
        onMutate: async () => {
            if (!props.currentQueryKey) {return { previous: undefined } as { previous?: any };}
            await queryClient.cancelQueries({ queryKey: memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))) });
            const key = memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? '')));
            const previous = queryClient.getQueryData<any>(key);
            if (previous && Array.isArray(previous.users)) {
                queryClient.setQueryData(key, (old: any) => ({ ...old, users: (old.users as any[]).filter((u) => u.id !== props.userId) }));
            }
            return { previous } as { previous?: any };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous && props.currentQueryKey) {
                queryClient.setQueryData(memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))), context.previous);
            }
        },
        onSettled: async () => {
            if (props.currentQueryKey) {
                await queryClient.invalidateQueries({ queryKey: memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey ?? ''))) });
            }
        },
    });


    return (
        <div className="mt-2 grid gap-2">
            <div className="text-[11px] text-[oklch(var(--muted-foreground))]">Status: {props.status}</div>

            <form action={(formData) => updateRoles.mutate(formData)} className="flex flex-col gap-2">
                <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-[oklch(var(--muted-foreground))]">Role</span>
                    <input
                        name="roles"
                        defaultValue={props.initialRoles}
                        className="h-9 w-full rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm text-[oklch(var(--foreground))]"
                    />
                </label>
                <span className="text-[11px] text-[oklch(var(--muted-foreground))]">Only one role is currently supported.</span>
                {updateRoles.isError ? (
                    <p className="text-xs text-[oklch(var(--muted-foreground))]">
                        {updateRoles.error instanceof Error ? updateRoles.error.message : 'Unable to update roles'}
                    </p>
                ) : null}
                <button type="submit" disabled={updateRoles.isPending} className="h-9 w-fit rounded-md bg-[oklch(var(--primary))] px-3 text-sm font-medium text-[oklch(var(--primary-foreground))] disabled:opacity-70">
                    Update roles
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                <form action={() => suspend.mutate()}>
                    <button type="submit" disabled={!canSuspend || suspend.isPending} className="h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70">
                        Suspend
                    </button>
                </form>
                <form action={() => resume.mutate()}>
                    <button type="submit" disabled={!canResume || resume.isPending} className="h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70">
                        Resume
                    </button>
                </form>
                <button type="button" onClick={() => removeFromOrg.mutate()} disabled={removeFromOrg.isPending} className="h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70">Remove from org</button>
            </div>
        </div>
    );
}




