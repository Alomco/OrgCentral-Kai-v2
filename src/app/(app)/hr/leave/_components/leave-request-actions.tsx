"use client";

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    approveLeaveRequestAction,
    rejectLeaveRequestAction,
    cancelLeaveRequestAction,
} from '../actions';
import { cn } from '@/lib/utils';

interface LeaveRequestActionsProps {
    requestId: string;
    status: string;
    isActor: boolean;
    canApprove: boolean;
    canManage: boolean;
}

export function LeaveRequestActions({ requestId, status, isActor, canApprove, canManage }: LeaveRequestActionsProps) {
    const [pending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    const showApproveReject = status === 'submitted' && canApprove;
    const showCancel = (status === 'submitted' || status === 'approved') && (isActor || canManage);

    if (!showApproveReject && !showCancel) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    function handleApprove() {
        setMessage(null);
        startTransition(async () => {
            const form = new FormData();
            form.set('requestId', requestId);
            const result = await approveLeaveRequestAction(form);
            setMessage(result.message ?? null);
        });
    }

    function handleReject() {
        setMessage(null);
        startTransition(async () => {
            const form = new FormData();
            form.set('requestId', requestId);
            form.set('reason', rejectReason);
            const result = await rejectLeaveRequestAction(form);
            setMessage(result.message ?? null);
        });
    }

    function handleCancel() {
        setMessage(null);
        startTransition(async () => {
            const form = new FormData();
            form.set('requestId', requestId);
            if (cancelReason.trim()) {
                form.set('reason', cancelReason.trim());
            }
            const result = await cancelLeaveRequestAction(form);
            setMessage(result.message ?? null);
        });
    }

    return (
        <div className="space-y-2 text-right">
            {showApproveReject ? (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button size="sm" variant="default" onClick={handleApprove} disabled={pending}>
                            {pending ? '...' : 'Approve'}
                        </Button>
                        <Input
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Reject reason"
                            className="h-9 w-full sm:max-w-[180px]"
                        />
                        <Button size="sm" variant="destructive" onClick={handleReject} disabled={pending || rejectReason.trim().length < 5}>
                            {pending ? '...' : 'Reject'}
                        </Button>
                    </div>
                </div>
            ) : null}

            {showCancel ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        placeholder="Cancel reason (optional)"
                        className="h-9 w-full sm:max-w-[180px]"
                    />
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={pending}>
                        {pending ? '...' : 'Cancel'}
                    </Button>
                </div>
            ) : null}

            {message ? (
                <div className={cn('text-xs', message.toLowerCase().includes('unable') ? 'text-destructive' : 'text-muted-foreground')}>
                    {message}
                </div>
            ) : null}
        </div>
    );
}
