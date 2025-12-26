import type { LeaveRequestFormValues } from './schema';
import type { FieldErrors } from '../_components/form-errors';

export type LeaveRequestFormStatus = 'idle' | 'success' | 'error';

export interface LeaveRequestFormState {
    status: LeaveRequestFormStatus;
    message?: string;
    fieldErrors?: FieldErrors<LeaveRequestFormValues>;
    values: LeaveRequestFormValues;
}

export function buildInitialLeaveRequestFormState(
    values: LeaveRequestFormValues,
): LeaveRequestFormState {
    return { status: 'idle', fieldErrors: undefined, values };
}
