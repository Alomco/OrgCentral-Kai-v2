import { TableCell, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getTimeEntriesForUi } from '@/server/use-cases/hr/time-tracking/get-time-entries.cached';

import { formatHumanDate } from '../../_components/format-date';
import { HrDataTable, type HrDataTableColumn } from '../../_components/hr-data-table';
import { HrStatusBadge } from '../../_components/hr-status-badge';

export interface TimeEntriesPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
}

const COLUMNS: readonly HrDataTableColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'clockIn', label: 'Clock In' },
    { key: 'clockOut', label: 'Clock Out' },
    { key: 'hours', label: 'Hours', className: 'text-right' },
    { key: 'status', label: 'Status' },
] as const;

function formatDate(value: Date | null | undefined): string {
    if (!value) {return '—';}
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {return '—';}
    return formatHumanDate(date);
}

function formatTime(value: Date | null | undefined): string {
    if (!value) {return '—';}
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {return '—';}
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatHours(value: number | { toNumber?: () => number } | null | undefined): string {
    if (value === null || value === undefined) {return '—';}
    const number_ = typeof value === 'object' && value.toNumber ? value.toNumber() : Number(value);
    if (Number.isNaN(number_)) {return '—';}
    return number_.toFixed(1);
}

export async function TimeEntriesPanel({ authorization, userId }: TimeEntriesPanelProps) {
    const result = await getTimeEntriesForUi({
        authorization,
        userId,
    });

    const entries = result.entries;

    return (
        <HrDataTable
            title="Time Entries"
            description="Your recent time tracking records."
            columns={COLUMNS}
            isEmpty={entries.length === 0}
            emptyMessage="No time entries recorded yet."
        >
            {entries.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                    <TableCell>{formatTime(entry.clockIn)}</TableCell>
                    <TableCell>{formatTime(entry.clockOut)}</TableCell>
                    <TableCell className="text-right">{formatHours(entry.totalHours)}</TableCell>
                    <TableCell>
                        <HrStatusBadge status={entry.status} />
                    </TableCell>
                </TableRow>
            ))}
        </HrDataTable>
    );
}
