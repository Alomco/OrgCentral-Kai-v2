'use server';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getTimeTrackingService } from '@/server/services/hr/time-tracking/time-tracking-service.provider';

import type { TimeEntryFormState } from './form-state';
import { createTimeEntrySchema } from './schema';

function formDataString(value: FormDataEntryValue | null): string {
    return typeof value === 'string' ? value : '';
}

export async function createTimeEntryAction(
    authorization: RepositoryAuthorizationContext,
    _previousState: TimeEntryFormState,
    formData: FormData,
): Promise<TimeEntryFormState> {
    const raw = {
        date: formData.get('date'),
        clockIn: formData.get('clockIn'),
        clockOut: formData.get('clockOut'),
        breakDuration: formData.get('breakDuration'),
        project: formData.get('project'),
        notes: formData.get('notes'),
    };

    const parsed = createTimeEntrySchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof typeof raw, string>> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as keyof typeof raw;
            fieldErrors[field] ??= issue.message;
        }
        return {
            status: 'error',
            message: 'Please fix the errors below.',
            fieldErrors,
            values: {
                date: formDataString(raw.date),
                clockIn: formDataString(raw.clockIn),
                clockOut: formDataString(raw.clockOut),
                breakDuration: Number(raw.breakDuration ?? 0),
                project: formDataString(raw.project),
                notes: formDataString(raw.notes),
            },
        };
    }

    try {
        const service = getTimeTrackingService();
        const dateString = parsed.data.date;
        const clockInTime = new Date(`${dateString}T${parsed.data.clockIn}:00`);
        const clockOutTime = parsed.data.clockOut
            ? new Date(`${dateString}T${parsed.data.clockOut}:00`)
            : undefined;

        await service.createTimeEntry({
            authorization,
            payload: {
                userId: authorization.userId,
                date: new Date(dateString),
                clockIn: clockInTime,
                clockOut: clockOutTime,
                breakDuration: parsed.data.breakDuration ?? 0,
                project: parsed.data.project,
                notes: parsed.data.notes,
            },
        });

        return {
            status: 'success',
            message: 'Time entry created successfully.',
            values: {
                date: new Date().toISOString().slice(0, 10),
                clockIn: new Date().toTimeString().slice(0, 5),
                clockOut: '',
                breakDuration: 0,
                project: '',
                notes: '',
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create time entry.';
        return {
            status: 'error',
            message,
            values: parsed.data,
        };
    }
}
