import type { CancelAbsenceFormValues, ReportAbsenceFormValues } from './schema';

export type ReportAbsenceFormStatus = 'idle' | 'success' | 'error';

export interface ReportAbsenceFormState {
    status: ReportAbsenceFormStatus;
    message?: string;
    fieldErrors?: Partial<Record<keyof ReportAbsenceFormValues, string>>;
    values: ReportAbsenceFormValues;
}

export function buildInitialReportAbsenceFormState(
    values?: Partial<ReportAbsenceFormValues>,
): ReportAbsenceFormState {
    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            typeId: values?.typeId ?? '',
            startDate: values?.startDate ?? new Date().toISOString().slice(0, 10),
            endDate: values?.endDate ?? '',
            hours: values?.hours ?? 8,
            reason: values?.reason ?? '',
        },
    };
}

/** Form state for cancel absence dialog. */
export interface CancelAbsenceFormState {
    status: ReportAbsenceFormStatus;
    message?: string;
    fieldErrors?: Partial<Record<keyof CancelAbsenceFormValues, string>>;
    values: CancelAbsenceFormValues;
}
