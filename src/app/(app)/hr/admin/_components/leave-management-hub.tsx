/**
 * Leave Management Hub - Pending Requests Table (Server Component)
 * Single Responsibility: Display pending leave requests for admin review
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaLeaveRequestRepository } from '@/server/repositories/prisma/hr/leave/prisma-leave-request-repository';
import { getLeaveRequests } from '@/server/use-cases/hr/leave/get-leave-requests';

import { formatHumanDate, leaveRequestStatusBadgeVariant } from '../../_components';
import { LeaveApprovalForm } from './leave-approval-form';

export interface LeaveManagementHubProps {
    authorization: RepositoryAuthorizationContext;
}

export async function LeaveManagementHub({ authorization }: LeaveManagementHubProps) {
    const deps = { leaveRequestRepository: new PrismaLeaveRequestRepository() };
    
    const { requests } = await getLeaveRequests(deps, {
        authorization,
        filters: { status: 'submitted' },
    });

    const pendingRequests = requests.slice(0, 20);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">Pending Leave Approvals</span>
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                </CardTitle>
                <CardDescription>
                    Review and approve/reject submitted leave requests
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingRequests.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">
                                            {request.employeeName}
                                        </TableCell>
                                        <TableCell>{request.leaveType}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatHumanDate(new Date(request.startDate))}
                                            {' – '}
                                            {formatHumanDate(new Date(request.endDate))}
                                        </TableCell>
                                        <TableCell>{request.totalDays} day(s)</TableCell>
                                        <TableCell>
                                            <Badge variant={leaveRequestStatusBadgeVariant(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {request.submittedAt 
                                                ? formatHumanDate(new Date(request.submittedAt)) 
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <LeaveApprovalForm requestId={request.id} />
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

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                No pending leave requests. All caught up!
            </p>
        </div>
    );
}
