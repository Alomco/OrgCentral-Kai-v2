'use client';

/**
 * Absence Acknowledge Form - Client Island
 * Single Responsibility: Interactive form for absence acknowledgment
 */

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircleIcon, EyeIcon } from 'lucide-react';

import { acknowledgeAbsenceAction, approveAbsenceAction } from '../actions/absence.actions';
import type { AbsenceAcknowledgeFormState } from '../_types';

interface AbsenceAcknowledgeFormProps {
    absenceId: string;
}

const initialState: AbsenceAcknowledgeFormState = { status: 'idle' };

export function AbsenceAcknowledgeForm({ absenceId }: AbsenceAcknowledgeFormProps) {
    const [ackState, ackAction, ackPending] = useActionState(acknowledgeAbsenceAction, initialState);
    const [approveState, approveAction, approvePending] = useActionState(approveAbsenceAction, initialState);

    const isPending = ackPending || approvePending;

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Quick Acknowledge */}
            <form action={ackAction}>
                <input type="hidden" name="absenceId" value={absenceId} />
                <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="gap-1"
                    aria-label="Acknowledge absence"
                >
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:inline">Acknowledge</span>
                </Button>
            </form>

            {/* Approve with Details Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="default"
                        disabled={isPending}
                        className="gap-1"
                        aria-label="Approve absence"
                    >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:inline">Approve</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form action={approveAction}>
                        <input type="hidden" name="absenceId" value={absenceId} />
                        <DialogHeader>
                            <DialogTitle>Approve absence</DialogTitle>
                            <DialogDescription>
                                Confirm approval and optionally add a return date.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="returnDate">Confirmed return date (optional)</Label>
                                <Input
                                    id="returnDate"
                                    name="returnDate"
                                    type="date"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    name="notes"
                                    placeholder="Example: return to work expected Monday"
                                    maxLength={500}
                                    className="mt-1.5"
                                />
                            </div>
                            {approveState.status === 'error' && (
                                <p className="text-sm text-destructive">{approveState.message}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={approvePending}>
                                {approvePending ? 'Approving...' : 'Confirm approval'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status feedback */}
            {ackState.status === 'success' && (
                <span className="text-xs text-emerald-600">✓ Acknowledged</span>
            )}
            {ackState.status === 'error' && (
                <span className="text-xs text-destructive">{ackState.message}</span>
            )}
        </div>
    );
}
