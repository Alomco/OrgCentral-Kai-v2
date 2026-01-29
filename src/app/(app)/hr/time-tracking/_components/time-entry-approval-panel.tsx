'use client';

import { memo, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approveTimeEntryAction, getPendingTimeEntriesAction, rejectTimeEntryAction } from '../actions';
import type { PendingTimeEntry } from '../pending-entries';

const pendingEntriesQueryKey = ['hr', 'time-tracking', 'pending'] as const;
const EMPTY_ENTRIES: PendingTimeEntry[] = [];
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function TimeEntryApprovalPanel({
    entries = EMPTY_ENTRIES,
}: {
    entries?: PendingTimeEntry[];
}) {
    const queryClient = useQueryClient();
    const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

    const { data: pendingEntries = entries } = useQuery({
        queryKey: pendingEntriesQueryKey,
        queryFn: getPendingTimeEntriesAction,
        initialData: entries,
    });

    const decisionMutation = useMutation({
        mutationFn: async ({
            entryId,
            decision,
        }: {
            entryId: string;
            decision: 'approve' | 'reject';
        }) => {
            const action = decision === 'approve' ? approveTimeEntryAction : rejectTimeEntryAction;
            await action(entryId);
            return entryId;
        },
        onSuccess: (entryId) => {
            queryClient.setQueryData<PendingTimeEntry[]>(
                pendingEntriesQueryKey,
                (current) => current?.filter((entry) => entry.id !== entryId) ?? current,
            );
            void queryClient.invalidateQueries({ queryKey: pendingEntriesQueryKey }).catch(() => null);
        },
    });

    const handleDecision = useCallback(
        (entryId: string, decision: 'approve' | 'reject') => {
            setActiveEntryId(entryId);
            decisionMutation.mutate(
                { entryId, decision },
                {
                    onSettled: () => {
                        setActiveEntryId(null);
                    },
                },
            );
        },
        [decisionMutation],
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Timesheet Approvals
                    </CardTitle>
                    <CardDescription>Completed entries awaiting review.</CardDescription>
                </div>
                {pendingEntries.length > 0 ? <Badge variant="secondary">{pendingEntries.length}</Badge> : null}
            </CardHeader>
            <CardContent className="space-y-3">
                {pendingEntries.length > 0 ? (
                    pendingEntries.map((entry) => (
                        <TimeEntryApprovalRow
                            key={entry.id}
                            entry={entry}
                            isPending={decisionMutation.isPending}
                            activeEntryId={activeEntryId}
                            onDecision={handleDecision}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-sm font-medium">No pending entries</p>
                        <p className="text-xs text-muted-foreground">
                            Completed time entries will appear here for approval.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface TimeEntryApprovalRowProps {
    entry: PendingTimeEntry;
    isPending: boolean;
    activeEntryId: string | null;
    onDecision: (entryId: string, decision: 'approve' | 'reject') => void;
}

const TimeEntryApprovalRow = memo(function TimeEntryApprovalRow({
    entry,
    isPending,
    activeEntryId,
    onDecision,
}: TimeEntryApprovalRowProps) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{entry.employeeName}</p>
                    {entry.project ? (
                        <Badge variant="outline" className="text-xs">
                            {entry.project}
                        </Badge>
                    ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    <span suppressHydrationWarning>
                        {DATE_FORMATTER.format(entry.date)}
                    </span>
                    {entry.totalHours ? ` | ${entry.totalHours.toFixed(2)}h` : ''}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isPending && activeEntryId === entry.id}
                    onClick={() => onDecision(entry.id, 'reject')}
                >
                    <XCircle className="h-4 w-4 text-red-500" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isPending && activeEntryId === entry.id}
                    onClick={() => onDecision(entry.id, 'approve')}
                >
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                </Button>
            </div>
        </div>
    );
});
