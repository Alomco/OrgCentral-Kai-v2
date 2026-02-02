import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
    { key: 'project', label: 'Project' },
    { key: 'clockIn', label: 'Clock In' },
    { key: 'clockOut', label: 'Clock Out' },
    { key: 'hours', label: 'Hours', className: 'text-right' },
    { key: 'billable', label: 'Billable' },
    { key: 'status', label: 'Status' },
] as const;

function formatDate(value: Date | null | undefined): string {
    if (!value) { return 'N/A'; }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return 'N/A'; }
    return formatHumanDate(date);
}

function formatTime(value: Date | null | undefined): string {
    if (!value) { return 'N/A'; }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return 'N/A'; }
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatHours(value: number | { toNumber?: () => number } | null | undefined): string {
    if (value === null || value === undefined) { return 'N/A'; }
    const number_ = typeof value === 'object' && value.toNumber ? value.toNumber() : Number(value);
    if (Number.isNaN(number_)) { return 'N/A'; }
    return number_.toFixed(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMetadata(entry: { metadata?: unknown }) {
    return isRecord(entry.metadata) ? entry.metadata : {};
}

function getOvertimeHours(entry: { metadata?: unknown }) {
    const metadata = getMetadata(entry);
    const overtime = metadata.overtimeHours;
    if (typeof overtime === 'number' && overtime > 0) {
        return overtime;
    }
    return null;
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
            {entries.map((entry) => {
                const metadata = getMetadata(entry);
                const overtimeHours = getOvertimeHours(entry);
                const projectCode =
                    typeof metadata.projectCode === 'string' && metadata.projectCode.trim().length > 0
                        ? metadata.projectCode
                        : 'Unassigned';

                return (
                    <TableRow key={entry.id}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                        <TableCell className="min-w-0 max-w-[240px]">
                            <div className="text-sm">
                                <div className="font-medium truncate">{entry.project ?? 'N/A'}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {projectCode}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatTime(entry.clockIn)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatTime(entry.clockOut)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                                <span>{formatHours(entry.totalHours)}</span>
                                {overtimeHours ? (
                                    <Badge variant="secondary" className="text-[10px]">
                                        OT {overtimeHours}
                                    </Badge>
                                ) : null}
                            </div>
                        </TableCell>
                        <TableCell>
                            {metadata.billable ? (
                                <Badge variant="default">Yes</Badge>
                            ) : (
                                <Badge variant="outline">No</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <HrStatusBadge status={entry.status} />
                        </TableCell>
                    </TableRow>
                );
            })}
        </HrDataTable>
    );
}

