/**
 * Leave Management Hub - Pending Requests Table (Server Component)
 * Single Responsibility: Display pending leave requests for admin review
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaLeaveRequestRepository } from '@/server/repositories/prisma/hr/leave/prisma-leave-request-repository';
import { getLeaveRequests } from '@/server/use-cases/hr/leave/get-leave-requests';

import { formatHumanDate, leaveRequestStatusBadgeVariant } from '../../_components';
import { LeaveRequestAttachmentsAdmin } from './leave-request-attachments-admin';
import { LeaveApprovalForm } from './leave-approval-form';
import { LeaveManagementActions } from './leave-management-actions';

export interface LeaveManagementHubProps {
    authorization: RepositoryAuthorizationContext;
    statusFilter?: 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'all';
    typeFilter?: string;
    employeeQuery?: string;
    departmentFilter?: string;
    dateFrom?: string;
    dateTo?: string;
    delegateFor?: string;
    searchParams?: Record<string, string | string[] | undefined>;
}

export async function LeaveManagementHub({ authorization, statusFilter = 'submitted', typeFilter, employeeQuery, departmentFilter, dateFrom, dateTo, delegateFor, searchParams }: LeaveManagementHubProps) {
    const resolvedStatus = typeof searchParams?.status === 'string' ? (searchParams.status as LeaveManagementHubProps['statusFilter']) : statusFilter;
    const resolvedType = typeof searchParams?.type === 'string' ? searchParams.type : typeFilter;
    const resolvedEmployee = typeof searchParams?.employee === 'string' ? searchParams.employee : employeeQuery;
    const resolvedDepartment = typeof searchParams?.department === 'string' ? searchParams.department : departmentFilter;
    const resolvedFrom = typeof searchParams?.from === 'string' ? searchParams.from : dateFrom;
    const resolvedTo = typeof searchParams?.to === 'string' ? searchParams.to : dateTo;
    const resolvedDelegate = typeof searchParams?.delegateFor === 'string' ? searchParams.delegateFor : delegateFor;

    const statusFieldId = 'leave-status-filter';
    const typeFieldId = 'leave-type-filter';
    const employeeFieldId = 'leave-employee-filter';
    const departmentFieldId = 'leave-department-filter';
    const fromFieldId = 'leave-from-date';
    const toFieldId = 'leave-to-date';

    const deps = { leaveRequestRepository: new PrismaLeaveRequestRepository() };

    const { requests } = await getLeaveRequests(deps, {
        authorization,
        filters: {
            status: resolvedStatus === 'all' ? undefined : resolvedStatus,
            startDate: resolvedFrom ? new Date(resolvedFrom) : undefined,
            endDate: resolvedTo ? new Date(resolvedTo) : undefined,
        },
    });

    const filteredRequests = requests
        .filter((request) => {
            if (resolvedType && request.leaveType !== resolvedType) { return false; }
            if (resolvedEmployee && !request.employeeName.toLowerCase().includes(resolvedEmployee.toLowerCase())) { return false; }
            if (resolvedDepartment) {
                const department = (request as { departmentId?: string | null }).departmentId;
                if (!department?.toLowerCase().includes(resolvedDepartment.toLowerCase())) { return false; }
            }
            return true;
        })
        .slice(0, 200);

    const exportableRequests = filteredRequests.map((request) => ({
        employeeName: request.employeeName,
        leaveType: request.leaveType,
        startDate: new Date(request.startDate).toISOString().slice(0, 10),
        endDate: new Date(request.endDate).toISOString().slice(0, 10),
        totalDays: request.totalDays,
        status: request.status,
        submittedAt: request.submittedAt ? new Date(request.submittedAt).toISOString() : '',
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">Pending Leave Approvals</span>
                    <Badge variant="secondary">{filteredRequests.length}</Badge>
                </CardTitle>
                <CardDescription>Review and approve or reject submitted leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <form className="grid w-full grid-cols-1 gap-2 md:grid-cols-5" method="get">
                        <input type="hidden" name="delegateFor" value={resolvedDelegate ?? ''} />
                        <div className="space-y-1">
                            <Label className="text-xs" htmlFor={statusFieldId}>Status</Label>
                            <select
                                id={statusFieldId}
                                name="status"
                                aria-label="Status"
                                defaultValue={resolvedStatus}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs" htmlFor={typeFieldId}>Type</Label>
                            <Input id={typeFieldId} name="type" defaultValue={resolvedType} className="w-full" placeholder="Annual" />
                            <p className="text-[11px] text-muted-foreground">Leave type name.</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs" htmlFor={employeeFieldId}>Employee</Label>
                            <Input id={employeeFieldId} name="employee" defaultValue={resolvedEmployee} className="w-full" placeholder="Search name" />
                            <p className="text-[11px] text-muted-foreground">Search by employee name.</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs" htmlFor={departmentFieldId}>Department</Label>
                            <Input id={departmentFieldId} name="department" defaultValue={resolvedDepartment} className="w-full" placeholder="Finance" />
                            <p className="text-[11px] text-muted-foreground">Optional filter.</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs" htmlFor={fromFieldId}>Date range</Label>
                            <div className="flex gap-2">
                                <Input id={fromFieldId} name="from" type="date" defaultValue={resolvedFrom} className="w-full" />
                                <Input id={toFieldId} name="to" type="date" defaultValue={resolvedTo} className="w-full" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Filter by start date.</p>
                        </div>
                        <LeaveManagementActions requests={exportableRequests} delegateFor={resolvedDelegate} />
                    </form>
                    {resolvedDelegate ? (
                        <div className="text-xs text-muted-foreground">Acting on behalf of {resolvedDelegate}. Filters are saved in the URL for sharing.</div>
                    ) : null}
                </div>
                {filteredRequests.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-auto">
                        <Table className="min-w-[920px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Evidence</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium min-w-0 max-w-[200px] truncate">
                                            {request.employeeName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[160px] truncate">
                                            {request.leaveType}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatHumanDate(new Date(request.startDate))}
                                            {' – '}
                                            {formatHumanDate(new Date(request.endDate))}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{request.totalDays} day(s)</TableCell>
                                        <TableCell>
                                            <Badge variant={leaveRequestStatusBadgeVariant(request.status)}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <LeaveRequestAttachmentsAdmin requestId={request.id} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {request.submittedAt
                                                ? formatHumanDate(new Date(request.submittedAt))
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right align-top">
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
