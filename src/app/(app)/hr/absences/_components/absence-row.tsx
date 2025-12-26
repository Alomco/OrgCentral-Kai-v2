'use client';

import { useState, useCallback } from 'react';
import { Eye, X, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { HrStatusBadge } from '../../_components/hr-status-badge';
import { formatHumanDate } from '../../_components/format-date';
import { AbsenceDetailDialog, type AbsenceDetailData } from './absence-detail-dialog';
import { CancelAbsenceDialog } from './cancel-absence-dialog';

export interface AbsenceRowData {
    id: string;
    typeId: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    reason: string | null;
    status: string;
    createdAt: Date;
}

export interface AbsenceRowProps {
    absence: AbsenceRowData;
    authorization: RepositoryAuthorizationContext;
}

const TYPE_INFO: Record<string, { label: string; emoji: string }> = {
    SICK_LEAVE: { label: 'Sick Leave', emoji: '🤒' },
    EMERGENCY: { label: 'Emergency', emoji: '🚨' },
    PERSONAL: { label: 'Personal', emoji: '👤' },
    OTHER: { label: 'Other', emoji: '📋' },
};

function formatDate(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return '—';
    }
    return formatHumanDate(value);
}

function formatHours(value: number): string {
    return value.toFixed(1);
}

export function AbsenceRow({ absence, authorization }: AbsenceRowProps) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const typeInfo = TYPE_INFO[absence.typeId] ?? { label: absence.typeId, emoji: '📋' };
    const canCancel = absence.status === 'REPORTED' || absence.status === 'APPROVED';

    const handleCancelSuccess = useCallback(() => {
        setCancelOpen(false);
    }, []);

    const detailData: AbsenceDetailData = {
        id: absence.id,
        typeId: absence.typeId,
        startDate: absence.startDate,
        endDate: absence.endDate,
        hours: absence.hours,
        reason: absence.reason,
        status: absence.status,
        createdAt: absence.createdAt,
    };

    return (
        <>
            <TableRow className="group transition-colors hover:bg-muted/40 motion-reduce:transition-none">
                <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                        <span className="text-base">{typeInfo.emoji}</span>
                        {typeInfo.label}
                    </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {formatDate(absence.startDate)} – {formatDate(absence.endDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {formatHours(absence.hours)}h
                </TableCell>
                <TableCell>
                    <HrStatusBadge status={absence.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                    {formatDate(absence.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailOpen(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            {canCancel ? (
                                <DropdownMenuItem
                                    onClick={() => setCancelOpen(true)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Absence
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            <AbsenceDetailDialog
                absence={detailData}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            {canCancel ? (
                <CancelAbsenceDialog
                    authorization={authorization}
                    absenceId={absence.id}
                    open={cancelOpen}
                    onOpenChange={setCancelOpen}
                    onSuccess={handleCancelSuccess}
                />
            ) : null}
        </>
    );
}
