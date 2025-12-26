import type { EnrollTrainingFormValues } from './schema';

export type EnrollTrainingFormStatus = 'idle' | 'success' | 'error';

export interface EnrollTrainingFormState {
    status: EnrollTrainingFormStatus;
    message?: string;
    fieldErrors?: Partial<Record<keyof EnrollTrainingFormValues, string>>;
    values: EnrollTrainingFormValues;
}

function buildTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

export function buildInitialEnrollTrainingFormState(
    values?: Partial<EnrollTrainingFormValues>,
): EnrollTrainingFormState {
    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            courseName: values?.courseName ?? '',
            provider: values?.provider ?? '',
            startDate: values?.startDate ?? buildTodayDateString(),
            endDate: values?.endDate ?? '',
            expiryDate: values?.expiryDate ?? '',
            cost: values?.cost ?? 0,
        },
    };
}
