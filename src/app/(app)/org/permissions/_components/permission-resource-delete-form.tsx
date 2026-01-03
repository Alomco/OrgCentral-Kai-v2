'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { Spinner } from '@/components/ui/spinner';

import {
    deletePermissionResourceAction,
    type PermissionResourceInlineState,
} from '../permission-resource-actions';

const initialInlineState: PermissionResourceInlineState = { status: 'idle' };

export function PermissionResourceDeleteForm(props: { resourceId: string }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(deletePermissionResourceAction, initialInlineState);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formReference = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    return (
        <form
            ref={formReference}
            action={action}
            className="flex flex-wrap items-center justify-end gap-2"
            aria-busy={pending}
        >
            <input type="hidden" name="resourceId" value={props.resourceId} />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete permission resource?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Roles and policies referencing this resource will
                            need to be updated.
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
                            {pending ? <Spinner className="mr-2" /> : null}
                            {pending ? 'Deleting...' : 'Delete resource'}
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
