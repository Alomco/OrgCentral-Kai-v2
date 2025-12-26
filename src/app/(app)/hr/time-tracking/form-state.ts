import type { CreateTimeEntryFormValues } from './schema';

export type TimeEntryFormStatus = 'idle' | 'success' | 'error';

export interface TimeEntryFormState {
    status: TimeEntryFormStatus;
    message?: string;
    fieldErrors?: Partial<Record<keyof CreateTimeEntryFormValues, string>>;
    values: CreateTimeEntryFormValues;
}

function buildTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

function buildCurrentTimeString(): string {
    return new Date().toTimeString().slice(0, 5);
}

export function buildInitialTimeEntryFormState(
    values?: Partial<CreateTimeEntryFormValues>,
): TimeEntryFormState {
    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            date: values?.date ?? buildTodayDateString(),
            clockIn: values?.clockIn ?? buildCurrentTimeString(),
            clockOut: values?.clockOut ?? '',
            breakDuration: values?.breakDuration ?? 0,
            project: values?.project ?? '',
            notes: values?.notes ?? '',
        },
    };
}
