'use client';

/**
 * Leave Approval Form - Client Island
 * Single Responsibility: Interactive form for approve/reject with useActionState
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
import { CheckIcon, XIcon } from 'lucide-react';

import { approveLeaveAction, rejectLeaveAction } from '../actions';
import type { LeaveApprovalFormState } from '../_types';

interface LeaveApprovalFormProps {
    requestId: string;
}

const initialState: LeaveApprovalFormState = { status: 'idle' };

export function LeaveApprovalForm({ requestId }: LeaveApprovalFormProps) {
    const [approveState, approveAction, approvePending] = useActionState(approveLeaveAction, initialState);
    const [rejectState, rejectAction, rejectPending] = useActionState(rejectLeaveAction, initialState);

    const isPending = approvePending || rejectPending;

    return (
        <div className="flex items-center justify-end gap-2">
            {/* Approve Button */}
            <form action={approveAction}>
                <input type="hidden" name="requestId" value={requestId} />
                <Button 
                    type="submit" 
                    size="sm" 
                    variant="default"
                    disabled={isPending}
                    className="gap-1"
                >
                    <CheckIcon className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:inline">Approve</span>
                </Button>
            </form>

            {/* Reject Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button 
                        size="sm" 
                        variant="destructive"
                        disabled={isPending}
                        className="gap-1"
                    >
                        <XIcon className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:inline">Reject</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form action={rejectAction}>
                        <input type="hidden" name="requestId" value={requestId} />
                        <DialogHeader>
                            <DialogTitle>Reject Leave Request</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this request.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="reason">Reason</Label>
                            <Input 
                                id="reason" 
                                name="reason" 
                                placeholder="Enter rejection reason..."
                                required 
                                minLength={1}
                                maxLength={500}
                                className="mt-1.5"
                            />
                            {rejectState.status === 'error' && (
                                <p className="mt-2 text-sm text-destructive">{rejectState.message}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={rejectPending}>
                                {rejectPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status feedback */}
            {approveState.status === 'success' && (
                <span className="text-xs text-emerald-600">✓ Approved</span>
            )}
            {approveState.status === 'error' && (
                <span className="text-xs text-destructive">{approveState.message}</span>
            )}
        </div>
    );
}
