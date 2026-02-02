'use client';

import type { ChangeEvent } from 'react';
import { AlertCircle, CalendarRange, FileText, Info, ShieldCheck } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import type { LeaveBalance } from '@/server/types/leave-types';

export interface LeavePolicySummary {
    jurisdiction: string;
    noticeRule: string;
    maxSpanDays: number;
    bankHolidaySource: string;
    dataResidency: string;
    dataClassification: string;
}

export function LeavePolicyDisclosure({ policySummary }: { policySummary?: LeavePolicySummary }) {
    if (!policySummary) { return null; }

    return (
        <div className="rounded-lg border bg-muted/70 p-3">
            <div className="flex flex-col gap-2 text-sm font-medium text-foreground sm:flex-row sm:items-center">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Classification {policySummary.dataClassification}</span>
                <Badge variant="secondary" className="sm:ml-auto">{policySummary.jurisdiction} • {policySummary.dataResidency}</Badge>
            </div>
            <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="policy">
                    <AccordionTrigger className="text-sm font-medium">Policy &amp; notice details</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" />Notice: {policySummary.noticeRule}</div>
                        <div className="flex items-start gap-2"><CalendarRange className="mt-0.5 h-4 w-4" />Single request limit: up to {policySummary.maxSpanDays} consecutive days.</div>
                        <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4" />Bank holidays reference: {policySummary.bankHolidaySource}.</div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export function LeaveBalanceGrid({ balances }: { balances?: LeaveBalance[] }) {
    if (!balances || balances.length === 0) { return null; }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((balance) => (
                <div key={balance.id} className="rounded-lg border bg-card/70 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 font-medium">
                        <span className="min-w-0 truncate">{balance.leaveType}</span>
                        <Badge variant="outline" className="shrink-0">{balance.available} days left</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Entitlement {balance.totalEntitlement} • Used {balance.used} • Pending {balance.pending}</div>
                </div>
            ))}
        </div>
    );
}

export function AttachmentsField({
    uploading,
    uploadError,
    uploadedAttachments,
    onChange,
    disabled,
    focusRingClass,
}: {
    uploading: boolean;
    uploadError: string | null;
    uploadedAttachments: { fileName: string }[];
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
    focusRingClass: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="evidence">Attachments (optional)</Label>
            <Input
                id="evidence"
                name="evidence"
                type="file"
                accept="application/pdf,image/*"
                onChange={onChange}
                aria-describedby="evidence-help"
                disabled={uploading || disabled}
                className={`cursor-pointer border-dashed ${focusRingClass}`}
            />
            <div id="evidence-help" className="text-xs text-muted-foreground">
                Upload supporting evidence (PDF or image, &lt; 5 MB). Files save to secure storage only.
            </div>
            {uploading ? <div className="text-xs text-muted-foreground">Uploading…</div> : null}
            {uploadedAttachments.length > 0 ? (
                <div className="text-xs text-green-600">{uploadedAttachments[0].fileName} uploaded.</div>
            ) : null}
            {uploadError ? <div className="text-xs text-destructive">{uploadError}</div> : null}
        </div>
    );
}


export function LeaveRequestPreviewDialog({
    open,
    onOpenChange,
    pending,
    onConfirm,
    focusRingClass,
    values,
    balanceText,
    policySummary,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pending: boolean;
    onConfirm: () => void;
    focusRingClass: string;
    values: {
        leaveType: string;
        startDate: string;
        endDate: string;
        calculatedDays: number;
        isHalfDay: boolean;
        reason: string;
    };
    balanceText?: string | null;
    policySummary?: LeavePolicySummary;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    disabled={pending}
                    size="lg"
                    className={`w-full sm:w-auto ${focusRingClass}`}
                >
                    Review summary then submit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm leave request</DialogTitle>
                    <DialogDescription>Double-check before submission. Submission happens after confirm.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
                        <span className="font-medium text-foreground">Type</span>
                        <span className="break-words">{values.leaveType || '—'}</span>
                        <span className="font-medium text-foreground">Dates</span>
                        <span className="break-words">{values.startDate || '—'} → {values.endDate || values.startDate || '—'}</span>
                        <span className="font-medium text-foreground">Days</span>
                        <span className="break-words">{values.calculatedDays}</span>
                        <span className="font-medium text-foreground">Half day</span>
                        <span className="break-words">{values.isHalfDay ? 'Yes (start date)' : 'No'}</span>
                        <span className="font-medium text-foreground sm:col-span-2">Reason</span>
                        <span className="break-words sm:col-span-2">{values.reason || '—'}</span>
                    </div>
                    {balanceText ? <div className="text-sm">Balance check: {balanceText}</div> : null}
                    {policySummary ? (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            <span>Notice: {policySummary.noticeRule} • Max span {policySummary.maxSpanDays} days</span>
                        </div>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button type="button" disabled={pending} className={`w-full ${focusRingClass}`} onClick={onConfirm}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Submitting…' : 'Submit request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
