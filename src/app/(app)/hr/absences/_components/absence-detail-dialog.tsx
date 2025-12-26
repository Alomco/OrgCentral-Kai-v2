'use client';

import { Calendar, Clock, FileText, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatHumanDate } from '../../_components/format-date';

export interface AbsenceDetailData {
    id: string;
    typeId: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    reason: string | null;
    status: string;
    createdAt: Date;
}

export interface AbsenceDetailDialogProps {
    absence: AbsenceDetailData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
    SICK_LEAVE: { label: 'Sick Leave', emoji: '🤒' },
    EMERGENCY: { label: 'Emergency', emoji: '🚨' },
    PERSONAL: { label: 'Personal', emoji: '👤' },
    OTHER: { label: 'Other', emoji: '📋' },
};

const STATUS_STYLES: Record<string, string> = {
    REPORTED: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    APPROVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    REJECTED: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    CANCELLED: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    CLOSED: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

function formatDate(date: Date): string {
    return formatHumanDate(new Date(date));
}

function DetailRow({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="mt-0.5 text-sm">{children}</div>
            </div>
        </div>
    );
}

export function AbsenceDetailDialog({
    absence,
    open,
    onOpenChange,
}: AbsenceDetailDialogProps) {
    if (!absence) {return null;}

    const typeInfo = TYPE_LABELS[absence.typeId] ?? {
        label: absence.typeId,
        emoji: '📋',
    };
    const statusStyle = STATUS_STYLES[absence.status] ?? STATUS_STYLES.REPORTED;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.emoji}</span>
                        {typeInfo.label}
                    </DialogTitle>
                    <DialogDescription>
                        Absence details and status information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <Badge className={cn('font-medium', statusStyle)}>
                            {absence.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Reported {formatDate(absence.createdAt)}
                        </span>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        <DetailRow icon={Calendar} label="Period">
                            {formatDate(absence.startDate)} — {formatDate(absence.endDate)}
                        </DetailRow>

                        <DetailRow icon={Clock} label="Duration">
                            {absence.hours.toFixed(1)} hours
                        </DetailRow>

                        {absence.reason ? (
                            <DetailRow icon={FileText} label="Reason">
                                {absence.reason}
                            </DetailRow>
                        ) : null}

                        <DetailRow icon={Info} label="Reference ID">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                {absence.id.slice(0, 8)}
                            </code>
                        </DetailRow>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
