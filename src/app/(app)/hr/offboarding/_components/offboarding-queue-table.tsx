import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatOptionalText } from '../../employees/_components/employee-formatters';
import {
    formatChecklistProgressLabel,
    formatStatus,
    resolveStatusVariant,
    type OffboardingQueueRow,
} from './offboarding-queue-utils';

interface OffboardingQueueTableProps {
    rows: OffboardingQueueRow[];
}

export function OffboardingQueueTable({ rows }: OffboardingQueueTableProps) {
    return (
        <Table className="min-w-[720px]">
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checklist progress</TableHead>
                    <TableHead className="hidden md:table-cell">Started</TableHead>
                    <TableHead className="hidden md:table-cell">Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                            No offboarding records match the selected filters.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="min-w-0">
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-sm font-medium truncate">{row.employeeName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatOptionalText(row.employeeNumber)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={resolveStatusVariant(row.status)}>
                                    {formatStatus(row.status)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {row.checklistProgress ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {formatChecklistProgressLabel(
                                                    row.checklistProgress.completed,
                                                    row.checklistProgress.total,
                                                )}
                                            </span>
                                            <span>{row.checklistProgress.percent}%</span>
                                        </div>
                                        <Progress value={row.checklistProgress.percent} />
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No checklist</span>
                                )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {formatDate(row.startedAt)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {formatDate(row.completedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/hr/employees/${row.employeeId}?tab=lifecycle`}>
                                        View
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
