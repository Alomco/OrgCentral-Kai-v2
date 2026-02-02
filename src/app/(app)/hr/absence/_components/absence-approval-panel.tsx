'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AbsenceMetadata } from '@/server/domain/absences/metadata';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { AbsenceApprovalDialog } from './absence-approval-dialog';
import { approveAbsenceAction, rejectAbsenceAction } from '../actions';
import { getAbsenceDurationDisplay } from '../absence-duration';

interface PendingAbsence {
    id: string;
    employeeName: string;
    type: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    reason?: string;
    submittedAt: Date;
    metadata: AbsenceMetadata;
}

interface AbsenceApprovalPanelProps {
    authorization: RepositoryAuthorizationContext;
    pendingRequests: PendingAbsence[];
}

function formatDateRange(start: Date, end: Date): string {
    const startString = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    const endString = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    if (startString === endString) { return startString; }
    return startString + ' - ' + endString;
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) { return String(days) + 'd ago'; }
    if (hours > 0) { return String(hours) + 'h ago'; }
    return 'Just now';
}

export function AbsenceApprovalPanel({
    authorization,
    pendingRequests,
}: AbsenceApprovalPanelProps) {
    const hasRequests = pendingRequests.length > 0;
    const [selectedRequest, setSelectedRequest] = useState<PendingAbsence | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setSelectedRequest(null);
        }
    };

    const handleReview = (request: PendingAbsence) => {
        setSelectedRequest(request);
        setDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Approvals
                    </CardTitle>
                    <CardDescription>Absence requests awaiting your review</CardDescription>
                </div>
                {hasRequests ? (
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
                {hasRequests ? (
                    <>
                        {pendingRequests.slice(0, 5).map((request) => {
                            const durationDisplay = getAbsenceDurationDisplay({
                                metadata: request.metadata,
                                startDate: request.startDate,
                                endDate: request.endDate,
                                hours: request.hours,
                            });

                            return (
                                <div
                                    key={request.id}
                                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <p className="font-medium text-sm truncate">
                                                {request.employeeName}
                                            </p>
                                            <Badge variant="outline" className="max-w-[10rem] truncate text-xs">
                                                {request.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDateRange(request.startDate, request.endDate)} · {durationDisplay.label}
                                        </p>
                                        {durationDisplay.timeRange ? (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {durationDisplay.timeRange}
                                            </p>
                                        ) : null}
                                        {request.reason ? (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                                {request.reason}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(request.submittedAt)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReview(request)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {pendingRequests.length > 5 ? (
                            <Button variant="ghost" size="sm" className="w-full" asChild>
                                <Link href="/hr/absence/requests">
                                    View all {pendingRequests.length} requests
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-sm font-medium">All Caught Up!</p>
                        <p className="text-xs text-muted-foreground">
                            No pending absence requests to review
                        </p>
                    </div>
                )}
            </CardContent>
            <AbsenceApprovalDialog
                request={selectedRequest}
                open={dialogOpen}
                onOpenChange={handleOpenChange}
                onApprove={(absenceId, comments) =>
                    approveAbsenceAction(authorization, absenceId, comments)
                }
                onReject={(absenceId, reason) =>
                    rejectAbsenceAction(authorization, absenceId, reason)
                }
            />
        </Card>
    );
}
