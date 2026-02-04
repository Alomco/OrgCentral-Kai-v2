'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

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

import { deleteWorkflowTemplateAction } from '../actions';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message?: string | null;
}

const initialState: ActionState = { status: 'idle', message: null };

export interface WorkflowTemplateDeleteFormProps {
    templateId: string;
}

export function WorkflowTemplateDeleteForm({ templateId }: WorkflowTemplateDeleteFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_previousState: ActionState, formData: FormData) => deleteWorkflowTemplateAction(formData),
        initialState,
    );

    const [confirmOpen, setConfirmOpen] = useState(false);
    const formReference = useRef<HTMLFormElement | null>(null);
    const feedbackReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={formAction} className="inline-flex flex-col items-end gap-1" aria-busy={pending}>
            <input type="hidden" name="templateId" value={templateId} />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="outline" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Deleting…' : 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete workflow template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This deactivates the template. Existing invitations may still reference it.
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
                            {pending ? 'Deleting…' : 'Delete template'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {state.status === 'error' ? (
                <div
                    ref={feedbackReference}
                    tabIndex={-1}
                    className="text-xs text-destructive"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {state.message ?? 'Unable to delete template.'}
                </div>
            ) : null}
        </form>
    );
}