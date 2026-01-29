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
import { Spinner } from '@/components/ui/spinner';

import { deleteComplianceTemplateAction } from '../actions/compliance-templates';
import type { ComplianceTemplateInlineState } from '../compliance-template-form-utils';
import { COMPLIANCE_TEMPLATES_QUERY_KEY } from '../compliance-templates-query';

const initialInlineState: ComplianceTemplateInlineState = { status: 'idle' };

export function ComplianceTemplateDeleteForm(props: { templateId: string }) {
    const queryClient = useQueryClient();
    const [state, action, pending] = useActionState(deleteComplianceTemplateAction, initialInlineState);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formReference = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: COMPLIANCE_TEMPLATES_QUERY_KEY }).catch(() => null);
        }
    }, [queryClient, state.status]);

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
