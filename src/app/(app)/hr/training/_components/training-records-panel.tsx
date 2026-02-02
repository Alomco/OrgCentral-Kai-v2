import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getTrainingRecordsForUi } from '@/server/use-cases/hr/training/get-training-records.cached';

import { formatHumanDate } from '../../_components/format-date';
import { HrDataTable, type HrDataTableColumn } from '../../_components/hr-data-table';
import { HrStatusBadge } from '../../_components/hr-status-badge';

export interface TrainingRecordsPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    title?: string;
    description?: string;
}

const COLUMNS: readonly HrDataTableColumn[] = [
    { key: 'course', label: 'Course' },
    { key: 'provider', label: 'Provider' },
    { key: 'dates', label: 'Dates' },
    { key: 'status', label: 'Status' },
    { key: 'expiry', label: 'Expiry' },
] as const;

function formatDate(value: Date | null | undefined): string {
    if (!value) { return '—'; }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return '—'; }
    return formatHumanDate(date);
}

function isExpiringSoon(expiryDate: Date | null | undefined): boolean {
    if (!expiryDate) { return false; }
    const date = new Date(expiryDate);
    if (Number.isNaN(date.getTime())) { return false; }
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return date.getTime() - Date.now() < thirtyDays && date.getTime() > Date.now();
}

export async function TrainingRecordsPanel({
    authorization,
    userId,
    title,
    description,
}: TrainingRecordsPanelProps) {
    const result = await getTrainingRecordsForUi({
        authorization,
        userId,
    });

    const records = result.records;
    const resolvedTitle = title ?? 'Training Records';
    const resolvedDescription = description ?? 'Your training and certification history.';

    return (
        <HrDataTable
            title={resolvedTitle}
            description={resolvedDescription}
            columns={COLUMNS}
            isEmpty={records.length === 0}
            emptyMessage="No training records found."
        >
            {records.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-medium min-w-0 max-w-[220px] truncate">
                        {record.courseName}
                    </TableCell>
                    <TableCell className="min-w-0 max-w-[180px] truncate">{record.provider}</TableCell>
                    <TableCell className="whitespace-nowrap">
                        {formatDate(record.startDate)}
                        {record.endDate ? ` – ${formatDate(record.endDate)}` : ''}
                    </TableCell>
                    <TableCell>
                        <HrStatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                        {record.expiryDate ? (
                            <span className={isExpiringSoon(record.expiryDate) ? 'text-orange-600' : ''}>
                                {formatDate(record.expiryDate)}
                                {isExpiringSoon(record.expiryDate) ? (
                                    <Badge variant="outline" className="ml-2 text-orange-600">
                                        Soon
                                    </Badge>
                                ) : null}
                            </span>
                        ) : (
                            '—'
                        )}
                    </TableCell>
                </TableRow>
            ))}
        </HrDataTable>
    );
}
