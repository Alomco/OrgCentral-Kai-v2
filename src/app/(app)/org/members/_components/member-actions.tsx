'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MembershipStatus } from '@prisma/client';

import { InfoButton } from '@/components/ui/info-button';
import { updateMember, memberKeys, membersSearchKey, type MembersResponse } from './members.api';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export function MemberActions(props: { orgId: string; userId: string; initialRoles: string; status: MembershipStatus; currentQueryKey?: string }) {
    const queryClient = useQueryClient();
    const currentListKey = props.currentQueryKey
        ? memberKeys.list(props.orgId, membersSearchKey(new URLSearchParams(props.currentQueryKey)))
        : null;

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
            if (currentListKey) {
                await queryClient.invalidateQueries({ queryKey: currentListKey });
            }
        },
    });

    const suspend = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'SUSPENDED' });
            return undefined;
        },
        onSuccess: async () => {
            if (currentListKey) {
                await queryClient.invalidateQueries({ queryKey: currentListKey });
            }
        },
    });

    const resume = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'ACTIVE' });
            return undefined;
        },
        onSuccess: async () => {
            if (currentListKey) {
                await queryClient.invalidateQueries({ queryKey: currentListKey });
            }
        },
    });

    const canSuspend = props.status === 'ACTIVE';
    const canResume = props.status === 'SUSPENDED';

    const removeFromOrg = useMutation({
        mutationFn: async (): Promise<undefined> => {
            await updateMember(props.orgId, props.userId, { status: 'SUSPENDED' });
            return undefined;
        },
        onMutate: async () => {
            if (!currentListKey) {
                return { previous: undefined } as { previous?: MembersResponse };
            }
            await queryClient.cancelQueries({ queryKey: currentListKey });
            const previous = queryClient.getQueryData<MembersResponse>(currentListKey);
            if (previous) {
                queryClient.setQueryData<MembersResponse>(currentListKey, {
                    ...previous,
                    users: previous.users.filter((user) => user.id !== props.userId),
                });
            }
            return { previous } as { previous?: MembersResponse };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous && currentListKey) {
                queryClient.setQueryData(currentListKey, context.previous);
            }
        },
        onSettled: async () => {
            if (currentListKey) {
                await queryClient.invalidateQueries({ queryKey: currentListKey });
            }
        },
    });


    return (
        <div className="mt-2 grid gap-2">
            <div className="text-[11px] text-muted-foreground">Status: {props.status}</div>

            <form action={(formData) => updateRoles.mutate(formData)} className="flex flex-col gap-2">
                <label className="grid gap-1">
                    <span className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                        Role
                        <InfoButton
                            label="Member role"
                            sections={[
                                { label: 'What', text: 'Update the member role for access control.' },
                                { label: 'Prereqs', text: 'Only one role is supported today.' },
                                { label: 'Next', text: 'Review permissions after changes.' },
                                { label: 'Compliance', text: 'Role changes are audited.' },
                            ]}
                        />
                    </span>
                    <input
                        name="roles"
                        defaultValue={props.initialRoles}
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    />
                </label>
                <span className="text-[11px] text-muted-foreground">Only one role is currently supported.</span>
                {updateRoles.isError ? (
                    <p className="text-xs text-muted-foreground">
                        {updateRoles.error instanceof Error ? updateRoles.error.message : 'Unable to update roles'}
                    </p>
                ) : null}
                <button type="submit" disabled={updateRoles.isPending} className="h-9 w-fit rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-70">
                    Update roles
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                <form action={() => suspend.mutate()}>
                    <button type="submit" disabled={!canSuspend || suspend.isPending} className="h-9 w-fit rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground disabled:opacity-70">
                        Suspend
                    </button>
                </form>
                <form action={() => resume.mutate()}>
                    <button type="submit" disabled={!canResume || resume.isPending} className="h-9 w-fit rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground disabled:opacity-70">
                        Resume
                    </button>
                </form>
                <button type="button" onClick={() => removeFromOrg.mutate()} disabled={removeFromOrg.isPending} className="h-9 w-fit rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground disabled:opacity-70">Remove from org</button>
            </div>
        </div>
    );
}




