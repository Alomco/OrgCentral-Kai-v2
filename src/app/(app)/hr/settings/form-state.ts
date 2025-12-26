import type { HrSettingsFormValues } from './schema';
import type { FieldErrors } from '../_components/form-errors';

export interface HrSettingsFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<HrSettingsFormValues>;
    values: HrSettingsFormValues;
}

export function buildInitialHrSettingsFormState(values: HrSettingsFormValues): HrSettingsFormState {
    return { status: 'idle', fieldErrors: undefined, values };
}
