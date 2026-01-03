import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';

import { formatHumanDate } from '../../_components/format-date';
import { leaveRequestStatusBadgeVariant } from '../../_components/hr-badge-variants';

export interface LeaveRequestsPanelProps {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string;
    title?: string;
    description?: string;
}

function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return formatHumanDate(parsed);
}

export async function LeaveRequestsPanel({
    authorization,
    employeeId,
    title,
    description,
}: LeaveRequestsPanelProps) {
    const resolvedTitle = title ?? 'Requests';
    const resolvedDescription = description ?? 'Recent leave requests linked to your profile.';

    if (!employeeId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{resolvedTitle}</CardTitle>
                    <CardDescription>Your account is missing an employee identifier for this organization.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const result = await getLeaveRequestsForUi({ authorization, employeeId });
    const requests = result.requests;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{resolvedTitle}</CardTitle>
                <CardDescription>{resolvedDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No leave requests yet.</div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead className="text-right">Days</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{request.leaveType}</TableCell>
                                        <TableCell>
                                            {formatDate(request.startDate)}
                                            {' – '}
                                            {formatDate(request.endDate)}
                                        </TableCell>
                                        <TableCell className="text-right">{request.totalDays}</TableCell>
                                        <TableCell>
                                            <Badge variant={leaveRequestStatusBadgeVariant(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {request.submittedAt ? formatDate(request.submittedAt) : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
