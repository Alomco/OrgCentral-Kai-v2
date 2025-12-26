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

import { deleteChecklistTemplateAction } from '../actions';
import {
    buildInitialChecklistTemplateDeleteFormState,
    type ChecklistTemplateDeleteFormState,
} from '../checklist-templates.form-state';

export interface ChecklistTemplateDeleteFormProps {
    templateId: string;
}

export function ChecklistTemplateDeleteForm({ templateId }: ChecklistTemplateDeleteFormProps) {
    const initialState: ChecklistTemplateDeleteFormState = buildInitialChecklistTemplateDeleteFormState({ templateId });

    const typedAction: (
        previous: ChecklistTemplateDeleteFormState,
        formData: FormData,
    ) => Promise<ChecklistTemplateDeleteFormState> = deleteChecklistTemplateAction;

    const [state, action, pending] = useActionState(typedAction, initialState);

    const [confirmOpen, setConfirmOpen] = useState(false);

    const formReference = useRef<HTMLFormElement | null>(null);

    const feedbackReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={action} className="inline-flex flex-col items-end gap-1" aria-busy={pending}>
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
                        <AlertDialogTitle>Delete checklist template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Existing invitations may still reference the template.
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
