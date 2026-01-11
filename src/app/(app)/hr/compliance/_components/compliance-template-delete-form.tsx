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

import { deleteComplianceTemplateAction } from '../actions/compliance-templates';
import type { ComplianceTemplateInlineState } from '../compliance-template-form-utils';

const initialInlineState: ComplianceTemplateInlineState = { status: 'idle' };

export function ComplianceTemplateDeleteForm(props: { templateId: string }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(deleteComplianceTemplateAction, initialInlineState);
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
            <input type="hidden" name="templateId" value={props.templateId} />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete compliance template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Existing compliance items will keep their original template data.
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
                            {pending ? 'Deleting...' : 'Delete template'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {state.status === 'error' ? (
                <p className="text-xs text-destructive">{state.message ?? 'Unable to delete template.'}</p>
            ) : null}
        </form>
    );
}
