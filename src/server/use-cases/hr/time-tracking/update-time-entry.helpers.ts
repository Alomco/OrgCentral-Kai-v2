import { ValidationError } from '@/server/errors';
import { toNumber } from '@/server/domain/absences/conversions';
import type { ITimeEntryRepository } from '@/server/repositories/contracts/hr/time-tracking/time-entry-repository-contract';
import { assertValidTimeWindow } from '@/server/security/authorization';
import type { TimeEntry } from '@/server/types/hr-ops-types';
import type { UpdateTimeEntryPayload } from '@/server/types/hr-time-tracking-schemas';
import { normalizeString } from '@/server/use-cases/shared';
import { calculateTotalHours, mergeMetadata, mutateTimeEntryMetadata } from './utils';

export type TimeEntryUpdateShape = Parameters<ITimeEntryRepository['updateTimeEntry']>[2];

export interface TimeEntryUpdateContext {
    nextClockIn: Date;
    nextClockOut: Date | null;
    nextStatus: TimeEntry['status'];
    nextBreakDuration: number | null;
    shiftHours: number | null;
    nextTotalHours: number | null | undefined;
}

export function formatTimeEntryDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function describeTimeEntryStatus(status: TimeEntry['status']): string {
    return ` Status: ${status}.`;
}

export function assertEditableTimeEntry(current: TimeEntry, payload: UpdateTimeEntryPayload): void {
    if (current.status === 'APPROVED' || current.status === 'REJECTED') {
        throw new ValidationError('Approved or rejected time entries cannot be updated.');
    }

    if (payload.status === 'APPROVED' || payload.status === 'REJECTED') {
        throw new ValidationError('Use the approval flow to approve or reject time entries.');
    }
}

export function deriveUpdateContext(
    current: TimeEntry,
    payload: UpdateTimeEntryPayload,
): TimeEntryUpdateContext {
    const currentClockOut = current.clockOut ?? null;
    const nextClockIn = payload.clockIn ?? current.clockIn;
    const nextClockOut = payload.clockOut !== undefined ? payload.clockOut : currentClockOut;

    assertValidTimeWindow(nextClockIn, nextClockOut ?? undefined);

    const nextStatus = resolveNextStatus(current, payload, nextClockOut);
    assertStatusClockConsistency(nextStatus, nextClockOut);

    const nextBreakDuration =
        payload.breakDuration !== undefined
            ? payload.breakDuration
            : toNullableNumber(current.breakDuration);

    const shiftHours =
        nextClockOut === null
            ? null
            : (nextClockOut.getTime() - nextClockIn.getTime()) / 1000 / 60 / 60;

    assertBreakWithinShift(shiftHours, nextBreakDuration);

    const nextTotalHours = resolveNextTotalHours(
        {
            current,
            nextClockIn,
            nextClockOut,
            nextBreakDuration,
            shiftHours,
        },
        payload.totalHours,
    );

    return {
        nextClockIn,
        nextClockOut,
        nextStatus,
        nextBreakDuration,
        shiftHours,
        nextTotalHours,
    };
}

export function buildTimeEntryUpdates(
    current: TimeEntry,
    payload: UpdateTimeEntryPayload,
    context: TimeEntryUpdateContext,
): TimeEntryUpdateShape {
    const updates: TimeEntryUpdateShape = {};

    if (payload.clockIn && payload.clockIn.getTime() !== current.clockIn.getTime()) {
        updates.clockIn = payload.clockIn;
    }

    if (payload.clockOut !== undefined) {
        updates.clockOut = context.nextClockOut ?? null;
    }

    if (payload.breakDuration !== undefined) {
        updates.breakDuration = payload.breakDuration ?? null;
    }

    if (payload.project !== undefined) {
        updates.project = normalizeString(payload.project ?? undefined) ?? null;
    }

    if (payload.tasks !== undefined) {
        updates.tasks = payload.tasks ?? null;
    }

    if (payload.notes !== undefined) {
        updates.notes = normalizeString(payload.notes ?? undefined) ?? null;
    }

    if (payload.status !== undefined || payload.clockOut !== undefined) {
        if (context.nextStatus !== current.status) {
            updates.status = context.nextStatus;
        }
    }

    if (context.nextTotalHours !== undefined) {
        const currentTotalHours = toNullableNumber(current.totalHours);
        if (currentTotalHours !== context.nextTotalHours) {
            updates.totalHours = context.nextTotalHours;
        }
    }

    if (payload.metadata) {
        updates.metadata = mutateTimeEntryMetadata(current.metadata, (metadata) => {
            mergeMetadata(metadata, payload.metadata);
        });
    }

    return updates;
}

function resolveNextStatus(
    current: TimeEntry,
    payload: UpdateTimeEntryPayload,
    nextClockOut: Date | null,
): TimeEntry['status'] {
    if (payload.status) {
        return payload.status;
    }

    if (payload.clockOut !== undefined) {
        return nextClockOut ? 'COMPLETED' : 'ACTIVE';
    }

    return current.status;
}

function assertStatusClockConsistency(
    status: TimeEntry['status'],
    clockOut: Date | null,
): void {
    if (status === 'COMPLETED' && !clockOut) {
        throw new ValidationError('Completed time entries require a clock-out time.');
    }

    if (status === 'ACTIVE' && clockOut) {
        throw new ValidationError('Active time entries cannot have a clock-out time.');
    }
}

function assertBreakWithinShift(shiftHours: number | null, breakDuration: number | null): void {
    if (shiftHours === null || typeof breakDuration !== 'number') {
        return;
    }

    if (breakDuration > shiftHours) {
        throw new ValidationError('Break duration cannot exceed the shift duration.');
    }
}

function resolveNextTotalHours(
    context: {
        current: TimeEntry;
        nextClockIn: Date;
        nextClockOut: Date | null;
        nextBreakDuration: number | null;
        shiftHours: number | null;
    },
    requestedTotalHours: number | null | undefined,
): number | null | undefined {
    if (requestedTotalHours !== undefined) {
        if (
            context.shiftHours !== null
            && typeof requestedTotalHours === 'number'
            && requestedTotalHours > context.shiftHours
        ) {
            throw new ValidationError('Total hours cannot exceed the shift duration.');
        }
        return requestedTotalHours ?? null;
    }

    if (!context.nextClockOut) {
        const currentHours = toNullableNumber(context.current.totalHours);
        return currentHours !== null ? null : undefined;
    }

    return calculateTotalHours(
        context.nextClockIn,
        context.nextClockOut,
        context.nextBreakDuration,
    );
}

function toNullableNumber(
    value: number | { toNumber(): number } | null | undefined,
): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    return toNumber(value);
}
