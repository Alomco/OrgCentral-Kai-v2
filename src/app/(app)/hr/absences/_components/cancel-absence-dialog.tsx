'use client';

import { useActionState, useId, useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { cancelAbsenceAction } from '../actions';
import type { CancelAbsenceFormState } from '../form-state';

export interface CancelAbsenceDialogProps {
    authorization: RepositoryAuthorizationContext;
    absenceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const INITIAL_STATE: CancelAbsenceFormState = {
    status: 'idle',
    values: { reason: '' },
};

export function CancelAbsenceDialog({
    authorization,
    absenceId,
    open,
    onOpenChange,
    onSuccess,
}: CancelAbsenceDialogProps) {
    const formId = useId();
    const boundAction = cancelAbsenceAction.bind(null, authorization, absenceId);
    const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE);

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('🎉 Absence cancelled successfully!', {
                description: 'The absence has been marked as cancelled.',
            });
            onOpenChange(false);
            onSuccess?.();
        }
    }, [state.status, onOpenChange, onSuccess]);

    const isError = state.status === 'error';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                        Cancel Absence
                    </DialogTitle>
                    <DialogDescription>
                        This action will cancel the absence and restore any deducted leave balance.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-4">
                    {isError && state.message ? (
                        <Alert variant="destructive">
                            <X className="h-4 w-4" />
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-reason`}>
                            Reason for Cancellation <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id={`${formId}-reason`}
                            name="reason"
                            rows={3}
                            placeholder="Enter the reason for cancelling this absence..."
                            defaultValue={state.values.reason}
                            className="resize-none"
                            required
                        />
                        {state.fieldErrors?.reason ? (
                            <p className="text-xs text-destructive">{state.fieldErrors.reason}</p>
                        ) : null}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Keep Absence
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isPending}
                            className="gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                '⚠️ Cancel Absence'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
