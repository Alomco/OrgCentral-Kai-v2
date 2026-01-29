'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { permissionKeys } from './permissions.api';
import { deletePermissionResourceAction } from '../permission-resource-actions';
import type { PermissionResourceInlineState } from '../permission-resource-form-utils';

export function PermissionResourceDeleteForm(props: { orgId: string; resourceId: string }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formReference = useRef<HTMLFormElement | null>(null);
    const queryClient = useQueryClient();
    const [state, formAction, pending] = useActionState<PermissionResourceInlineState, FormData>(
        deletePermissionResourceAction,
        { status: 'idle' },
    );

    useEffect(() => {
        if (state.status === 'success') {
            queryClient.invalidateQueries({ queryKey: permissionKeys.list(props.orgId) }).catch(() => null);
        }
    }, [props.orgId, queryClient, state.status]);

    return (
        <form ref={formReference} action={formAction} className="flex flex-wrap items-center justify-end gap-2" aria-busy={pending}>
            <input type="hidden" name="resourceId" value={props.resourceId} />
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive" disabled={pending}>
                        {pending ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete permission resource?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Roles and policies referencing this resource will need to be updated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={() => {
                                setConfirmOpen(false);
                                formReference.current?.requestSubmit();
                            }}
                        >
                            {pending ? 'Deleting…' : 'Delete resource'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {state.status === 'error' ? (
                <p className="text-xs text-destructive">
                    {state.message ?? 'Unable to delete resource.'}
                </p>
            ) : null}
        </form>
    );
}
