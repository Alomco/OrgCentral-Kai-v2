'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, X, MoreHorizontal, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { AbsenceMetadata } from '@/server/domain/absences/metadata';
import { coerceAbsenceMetadata } from '@/server/domain/absences/metadata';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceAttachment, ReturnToWorkRecord, UnplannedAbsence } from '@/server/types/hr-ops-types';

import { HrStatusBadge } from '../../_components/hr-status-badge';
import { formatHumanDate } from '../../_components/format-date';
import { AbsenceDetailDialog, type AbsenceDetailData } from './absence-detail-dialog';
import { CancelAbsenceDialog } from './cancel-absence-dialog';
import { ReturnToWorkDialog } from './return-to-work-dialog';
import { getAbsenceDurationDisplay } from '../absence-duration';

export interface AbsenceRowData {
    id: string;
    typeId: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    reason: string | null;
    status: UnplannedAbsence['status'];
    createdAt: Date;
    attachments: AbsenceAttachment[];
    returnToWork: ReturnToWorkRecord | null;
    metadata: AbsenceMetadata;
    lifecycleNotes?: string | null;
}

export interface AbsenceRowProps {
    absence: AbsenceRowData;
    authorization: RepositoryAuthorizationContext;
    typeLabels: AbsenceTypeLabelMap;
    showNotes?: boolean;
}

export type AbsenceTypeLabelMap = Record<string, { label: string; emoji?: string }>;

function formatDate(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return '—';
    }
    return formatHumanDate(value);
}

export function AbsenceRow({ absence, authorization, typeLabels, showNotes = false }: AbsenceRowProps) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [currentAbsence, setCurrentAbsence] = useState(absence);

    useEffect(() => {
        setCurrentAbsence(absence);
    }, [absence]);

    const typeInfo = (typeLabels[currentAbsence.typeId] ?? { label: currentAbsence.typeId, emoji: '📋' });
    const typeEmoji = typeInfo.emoji ?? '📋';
    const canCancel = currentAbsence.status === 'REPORTED' || currentAbsence.status === 'APPROVED';
    const canReturnToWork = currentAbsence.status === 'REPORTED' || currentAbsence.status === 'APPROVED';

    const handleCancelSuccess = useCallback(() => {
        setCancelOpen(false);
    }, []);

    const handleAbsenceUpdated = useCallback((updated: UnplannedAbsence) => {
        setCurrentAbsence({
            id: updated.id,
            typeId: updated.typeId,
            startDate: updated.startDate,
            endDate: updated.endDate,
            hours: Number(updated.hours),
            reason: updated.reason ?? null,
            status: updated.status,
            createdAt: updated.createdAt,
            attachments: updated.attachments ?? [],
            returnToWork: updated.returnToWork ?? null,
            metadata: coerceAbsenceMetadata(updated.metadata),
        });
    }, []);

    const detailData: AbsenceDetailData = {
        id: currentAbsence.id,
        typeId: currentAbsence.typeId,
        startDate: currentAbsence.startDate,
        endDate: currentAbsence.endDate,
        hours: currentAbsence.hours,
        reason: currentAbsence.reason,
        status: currentAbsence.status,
        createdAt: currentAbsence.createdAt,
        attachments: currentAbsence.attachments,
        returnToWork: currentAbsence.returnToWork,
        metadata: currentAbsence.metadata,
    };

    const durationDisplay = getAbsenceDurationDisplay({
        metadata: currentAbsence.metadata,
        startDate: currentAbsence.startDate,
        endDate: currentAbsence.endDate,
        hours: currentAbsence.hours,
    });

    return (
        <>
            <TableRow className="group transition-colors hover:bg-muted/40 motion-reduce:transition-none">
                <TableCell className="font-medium max-w-[220px] min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="text-base">{typeEmoji}</span>
                        <span className="truncate">{typeInfo.label}</span>
                    </span>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(currentAbsence.startDate)} – {formatDate(currentAbsence.endDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    <div>{durationDisplay.label}</div>
                    {durationDisplay.timeRange ? (
                        <div className="text-xs text-muted-foreground">
                            {durationDisplay.timeRange}
                        </div>
                    ) : null}
                </TableCell>
                <TableCell>
                    <HrStatusBadge status={currentAbsence.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                    {formatDate(currentAbsence.createdAt)}
                </TableCell>
                {showNotes ? (
                    <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                        <span className="line-clamp-2 break-words">
                            {currentAbsence.lifecycleNotes ?? '—'}
                        </span>
                    </TableCell>
                ) : null}
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity motion-reduce:transition-none"
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
                            {canReturnToWork ? (
                                <DropdownMenuItem onClick={() => setReturnOpen(true)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Record Return to Work
                                </DropdownMenuItem>
                            ) : null}
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
                onAbsenceUpdated={(updated) => setCurrentAbsence(updated)}
                typeLabels={typeLabels}
            />

            {canReturnToWork ? (
                <ReturnToWorkDialog
                    absenceId={currentAbsence.id}
                    startDate={currentAbsence.startDate}
                    open={returnOpen}
                    onOpenChange={setReturnOpen}
                    onAbsenceUpdated={handleAbsenceUpdated}
                />
            ) : null}

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
