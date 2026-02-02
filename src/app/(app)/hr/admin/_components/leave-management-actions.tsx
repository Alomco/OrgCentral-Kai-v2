'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { LeaveDelegationControl } from './leave-delegation-control';

interface ExportableRequest {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    submittedAt?: string | null;
}

interface Props {
    requests: ExportableRequest[];
    delegateFor?: string | null;
}

export function LeaveManagementActions({ requests, delegateFor }: Props) {
    const hasRows = requests.length > 0;

    return (
        <div className="col-span-full flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" variant="outline">Apply filters</Button>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!hasRows}
                onClick={() => downloadCsv(requests)}
            >
                Export CSV
            </Button>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <LeaveDelegationControl delegateFor={delegateFor} />
        </div>
    );
}

function downloadCsv(requests: ExportableRequest[]) {
    if (!requests.length) { return; }

    const header = ['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Submitted'];
    const rows = requests.map((r) => [
        r.employeeName,
        r.leaveType,
        r.startDate,
        r.endDate,
        r.totalDays,
        r.status,
        r.submittedAt ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leave-requests.csv';
    link.click();
    URL.revokeObjectURL(url);
}
