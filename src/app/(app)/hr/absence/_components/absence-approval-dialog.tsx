'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { AbsenceMetadata } from '@/server/domain/absences/metadata';
import { getAbsenceDurationDisplay } from '../absence-duration';

interface AbsenceRequest {
    id: string;
    employeeName: string;
    type: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    reason?: string;
    metadata: AbsenceMetadata;
}

interface AbsenceApprovalDialogProps {
    request: AbsenceRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove?: (id: string, comments: string) => Promise<void>;
    onReject?: (id: string, reason: string) => Promise<void>;
}

const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

const DIALOG_HEADER = (
    <DialogHeader>
        <DialogTitle>Absence Request Review</DialogTitle>
        <DialogDescription>
            Review and respond to this absence request
        </DialogDescription>
    </DialogHeader>
);

function formatDateRange(start: Date, end: Date): string {
    const startString = DATE_RANGE_FORMATTER.format(start);
    const endString = DATE_RANGE_FORMATTER.format(end);
    if (startString === endString) { return startString; }
    return startString + ' - ' + endString;
}

export function AbsenceApprovalDialog({
    request,
    open,
    onOpenChange,
    onApprove,
    onReject,
}: AbsenceApprovalDialogProps) {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [comments, setComments] = useState('');
    const [isPending, startTransition] = useTransition();
    const approveReference = useRef(onApprove);
    const rejectReference = useRef(onReject);

    useEffect(() => {
        approveReference.current = onApprove;
        rejectReference.current = onReject;
    }, [onApprove, onReject]);

    const handleApprove = () => {
        if (!request || !approveReference.current) { return; }
        startTransition(() => {
            const promise = approveReference.current?.(request.id, comments);
            if (promise) {
                promise
                    .then(() => handleClose())
                    .catch(() => null);
            }
        });
    };

    const handleReject = () => {
        if (!request || !rejectReference.current) { return; }
        if (!comments.trim()) {
            setAction('reject');
            return;
        }
        startTransition(() => {
            const promise = rejectReference.current?.(request.id, comments);
            if (promise) {
                promise
                    .then(() => handleClose())
                    .catch(() => null);
            }
        });
    };

    const handleClose = () => {
        setAction(null);
        setComments('');
        onOpenChange(false);
    };

    if (!request) { return null; }

    const durationDisplay = getAbsenceDurationDisplay({
        metadata: request.metadata,
        startDate: request.startDate,
        endDate: request.endDate,
        hours: request.hours,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                {DIALOG_HEADER}

                <div className="space-y-4 py-4">
                    {/* Request Details */}
                    <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{request.employeeName}</span>
                            <Badge variant="secondary">{request.type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p suppressHydrationWarning>
                                {formatDateRange(request.startDate, request.endDate)}
                            </p>
                            <p className="text-xs">
                                {durationDisplay.label}
                                {durationDisplay.timeRange ? ` · ${durationDisplay.timeRange}` : ''}
                            </p>
                        </div>
                        {request.reason ? (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">Reason:</p>
                                <p className="text-sm">{request.reason}</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Comments/Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="comments">
                            {action === 'reject' ? 'Rejection Reason *' : 'Comments (optional)'}
                        </Label>
                        <Textarea
                            id="comments"
                            placeholder={
                                action === 'reject'
                                    ? 'Please provide a reason for rejection...'
                                    : 'Add any comments...'
                            }
                            value={comments}
                            onChange={(event) => setComments(event.target.value)}
                            rows={3}
                        />
                        {action === 'reject' && !comments.trim() ? (
                            <p className="text-xs text-destructive">
                                A reason is required when rejecting a request
                            </p>
                        ) : null}
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isPending || (action === 'reject' && !comments.trim())}
                    >
                        {isPending && action === 'reject' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                    </Button>
                    <Button onClick={handleApprove} disabled={isPending}>
                        {isPending && action === 'approve' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
