'use client';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { AttachmentsField, LeaveBalanceGrid, LeavePolicyDisclosure, type LeavePolicySummary, LeaveRequestPreviewDialog } from './leave-request-form.sections';
import { LeaveDateRangeFields } from './leave-request-form.dates';
import { useLeaveRequestForm } from './leave-request-form.state';
import { FieldError } from '../../_components/field-error';
import type { LeaveRequestFormState } from '../form-state';
import type { LeaveBalance } from '@/server/types/leave-types';

export interface LeaveRequestFormProps {
    initialState: LeaveRequestFormState;
    policySummary?: LeavePolicySummary;
    balances?: LeaveBalance[];
}

const focusRingClass = 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none';

export function LeaveRequestForm({ initialState, policySummary, balances }: LeaveRequestFormProps) {
    const {
        state,
        action,
        pending,
        leaveTypeErrorId,
        totalDaysErrorId,
        startDateErrorId,
        endDateErrorId,
        reasonErrorId,
        feedbackRef,
        formRef,
        confirmedSubmit,
        isHalfDay,
        setIsHalfDay,
        leaveType,
        setLeaveType,
        leaveTypeOptions,
        selectedBalance,
        startDate,
        endDate,
        setEndDate,
        reason,
        setReason,
        calculatedDays,
        showPreview,
        setShowPreview,
        requestId,
        uploading,
        uploadError,
        uploadedAttachments,
        attachmentsValue,
        handleEvidenceChange,
        handleConfirmSubmit,
        halfDayLockedToSingleDate,
        balanceText,
        handleStartDateChange,
    } = useLeaveRequestForm(initialState, balances);

    return (
        <Card className="border-muted/70 shadow-sm">
            <CardHeader className="space-y-3">
                <div className="space-y-1">
                    <CardTitle>Request leave</CardTitle>
                    <CardDescription>Request personal leave, preview balance, and confirm before submitting.</CardDescription>
                </div>
                <LeavePolicyDisclosure policySummary={policySummary} />
            </CardHeader>
            <CardContent className="space-y-6">
                <LeaveBalanceGrid balances={balances} />

                {state.status !== 'idle' ? (
                    <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
                        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
                            <AlertTitle>{state.status === 'success' ? 'Success' : 'Error'}</AlertTitle>
                            <AlertDescription>{state.message ?? 'Something went wrong.'}</AlertDescription>
                        </Alert>
                    </div>
                ) : null}

                <form ref={formRef} action={action} className="space-y-6">
                    <fieldset disabled={pending} className="space-y-6">
                        <input type="hidden" name="requestId" value={requestId} />
                        <input type="hidden" name="confirm" value={confirmedSubmit ? 'true' : ''} />
                        <input type="hidden" name="attachments" value={attachmentsValue} />

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="leaveType">Leave type <span className="text-destructive">*</span></Label>
                                    <div className="text-xs text-muted-foreground">Select from your entitlement.</div>
                                </div>
                                <Select
                                    value={leaveType}
                                    onValueChange={setLeaveType}
                                    required
                                    disabled={leaveTypeOptions.length === 0}
                                >
                                    <SelectTrigger
                                        id="leaveType"
                                        aria-invalid={leaveTypeErrorId ? 'true' : undefined}
                                        aria-describedby={leaveTypeErrorId}
                                        className={focusRingClass}
                                    >
                                        <SelectValue placeholder={leaveTypeOptions.length === 0 ? 'No leave types available' : 'Choose a leave type'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypeOptions.length === 0 ? (
                                            <SelectItem value="__no-types__" disabled>No leave types configured</SelectItem>
                                        ) : (
                                            leaveTypeOptions.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="leaveType" value={leaveType} />
                                <div className="text-xs text-muted-foreground">
                                    {selectedBalance
                                        ? `Entitlement ${selectedBalance.totalEntitlement.toLocaleString()} • Available ${selectedBalance.available.toLocaleString()} • Pending ${selectedBalance.pending.toLocaleString()}`
                                        : leaveTypeOptions.length === 0
                                            ? 'No leave types found for this org; contact an administrator.'
                                            : 'Matches your available leave types above.'}
                                </div>
                                <FieldError id={leaveTypeErrorId} message={state.fieldErrors?.leaveType} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason (optional)</Label>
                                <Textarea
                                    id="reason"
                                    name="reason"
                                    rows={3}
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder="Add a short note for your approvers"
                                    aria-invalid={reasonErrorId ? 'true' : undefined}
                                    aria-describedby={reasonErrorId}
                                    className={focusRingClass}
                                />
                                <FieldError id={reasonErrorId} message={state.fieldErrors?.reason} />
                            </div>
                        </div>

                        <LeaveDateRangeFields
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={handleStartDateChange}
                            onEndDateChange={setEndDate}
                            isHalfDay={isHalfDay}
                            onHalfDayChange={(checked) => {
                                setIsHalfDay(checked);
                                if (checked) { setEndDate(startDate || endDate); }
                            }}
                            halfDayLockedToSingleDate={halfDayLockedToSingleDate}
                            startDateErrorId={startDateErrorId}
                            endDateErrorId={endDateErrorId}
                            startDateError={state.fieldErrors?.startDate}
                            endDateError={state.fieldErrors?.endDate}
                            pending={pending}
                            focusRingClass={focusRingClass}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="totalDays">Calculated days</Label>
                                <Input
                                    id="totalDays"
                                    name="totalDays"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    min="0.5"
                                    max="365"
                                    value={calculatedDays}
                                    readOnly
                                    aria-invalid={totalDaysErrorId ? 'true' : undefined}
                                    aria-describedby={`${totalDaysErrorId ?? ''} totalDays-help`.trim()}
                                    className={focusRingClass}
                                />
                                <div id="totalDays-help" className="text-xs text-muted-foreground">
                                    Auto-calculated from dates (weekends counted). Bank holidays are checked during approval.
                                </div>
                                <FieldError id={totalDaysErrorId} message={state.fieldErrors?.totalDays} />
                            </div>

                            <AttachmentsField
                                uploading={uploading}
                                uploadError={uploadError}
                                uploadedAttachments={uploadedAttachments}
                                onChange={handleEvidenceChange}
                                disabled={pending}
                                focusRingClass={focusRingClass}
                            />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <LeaveRequestPreviewDialog
                                open={showPreview}
                                onOpenChange={setShowPreview}
                                pending={pending}
                                onConfirm={handleConfirmSubmit}
                                focusRingClass={focusRingClass}
                                values={{
                                    leaveType,
                                    startDate,
                                    endDate: halfDayLockedToSingleDate ? startDate : endDate,
                                    calculatedDays,
                                    isHalfDay,
                                    reason,
                                }}
                                balanceText={balanceText}
                                policySummary={policySummary}
                            />
                            <div className="flex items-start gap-2 text-xs text-muted-foreground sm:max-w-[28rem]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Approvers see your note; manager signs first, HR follows. No sensitive data is cached.</span>
                            </div>
                        </div>
                    </fieldset>
                </form>
            </CardContent>
        </Card>
    );
}
