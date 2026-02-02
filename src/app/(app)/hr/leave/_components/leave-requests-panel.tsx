import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import { LeaveRequestAttachments } from './leave-request-attachments';
import { appLogger } from '@/server/logging/structured-logger';
import { LeaveRequestActions } from './leave-request-actions';
import { canApproveLeave, canManageLeave } from '@/server/security/authorization/hr-guards/leave';

import { formatHumanDate } from '../../_components/format-date';
import { leaveRequestStatusBadgeVariant } from '../../_components/hr-badge-variants';

export interface LeaveRequestsPanelProps {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string;
    title?: string;
    description?: string;
    approverChain?: {
        primary: string;
        fallback?: string;
        slaDays?: number;
        notes?: string;
    };
    requests?: LeaveRequest[];
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
    approverChain,
    requests: initialRequests,
}: LeaveRequestsPanelProps) {
    const resolvedTitle = title ?? 'Requests';
    const resolvedDescription = description ?? 'Recent leave requests linked to your profile.';
    const slaDaysLabel = approverChain?.slaDays ? approverChain.slaDays.toLocaleString() : null;

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

    let requests: Awaited<ReturnType<typeof getLeaveRequestsForUi>>['requests'] = initialRequests ?? [];
    let loadError: string | null = null;
    if (!initialRequests) {
        try {
            const result = await getLeaveRequestsForUi({ authorization, employeeId });
            requests = result.requests;
        } catch (error) {
            loadError = error instanceof Error ? error.message : 'Unable to load leave requests.';
            appLogger.error('hr.leave.requests.load.failed', {
                orgId: authorization.orgId,
                employeeId,
                error: loadError,
            });
            requests = [];
        }
    }

    const approver = canApproveLeave(authorization);
    const manager = canManageLeave(authorization);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{resolvedTitle}</CardTitle>
                <CardDescription>{resolvedDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {loadError ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {loadError}
                        </div>
                    ) : null}
                    {requests.length === 0 ? (
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div>No leave requests yet. Submit a request on the left to track status and approvals here.</div>
                            <div className="text-xs">You will see submission time, approver SLA, and evidence links once created.</div>
                        </div>
                    ) : (
                        <div className="overflow-auto">
                            <Table className="min-w-[900px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead className="text-right">Days</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Evidence</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Approver/SLA</TableHead>
                                        {approver || manager ? (
                                            <TableHead className="text-right">Actions</TableHead>
                                        ) : null}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium max-w-[220px] truncate">{request.leaveType}</TableCell>
                                            <TableCell className="whitespace-nowrap">
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
                                            <TableCell>
                                                <LeaveRequestAttachments authorization={authorization} requestId={request.id} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {request.submittedAt ? formatDate(request.submittedAt) : '—'}
                                            </TableCell>
                                            <TableCell className="max-w-[220px]">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="truncate">
                                                                {approverChain?.primary ?? 'Manager'}
                                                                {slaDaysLabel ? ` · ${slaDaysLabel}d SLA` : ''}
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Primary approver: {approverChain?.primary ?? 'manager'}
                                                                {approverChain?.fallback ? ` (fallback ${approverChain.fallback})` : ''}.
                                                                {slaDaysLabel ? ` Target decision: ${slaDaysLabel} business days.` : ''}
                                                            </p>
                                                            {approverChain?.notes ? <p className="text-xs text-muted-foreground mt-1">{approverChain.notes}</p> : null}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            {approver || manager ? (
                                                <TableCell className="text-right">
                                                    <LeaveRequestActions
                                                        requestId={request.id}
                                                        status={request.status}
                                                        isActor={request.userId === authorization.userId}
                                                        canApprove={approver}
                                                        canManage={manager}
                                                    />
                                                </TableCell>
                                            ) : null}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
