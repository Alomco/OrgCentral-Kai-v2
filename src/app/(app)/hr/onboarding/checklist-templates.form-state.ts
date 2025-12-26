import type {
    ChecklistTemplateCreateFormValues,
    ChecklistTemplateDeleteFormValues,
    ChecklistTemplateUpdateFormValues,
} from './checklist-templates.schema';
import type { FieldErrors } from '../_components/form-errors';

export type ChecklistTemplateFormStatus = 'idle' | 'error';

export interface ChecklistTemplateCreateFormState {
    status: ChecklistTemplateFormStatus;
    message?: string;
    fieldErrors?: FieldErrors<ChecklistTemplateCreateFormValues>;
    values: ChecklistTemplateCreateFormValues;
}

export function buildInitialChecklistTemplateCreateFormState(
    values: ChecklistTemplateCreateFormValues,
): ChecklistTemplateCreateFormState {
    return { status: 'idle', values };
}

export interface ChecklistTemplateUpdateFormState {
    status: ChecklistTemplateFormStatus;
    message?: string;
    fieldErrors?: FieldErrors<ChecklistTemplateUpdateFormValues>;
    values: ChecklistTemplateUpdateFormValues;
}

export function buildInitialChecklistTemplateUpdateFormState(
    values: ChecklistTemplateUpdateFormValues,
): ChecklistTemplateUpdateFormState {
    return { status: 'idle', values };
}

export interface ChecklistTemplateDeleteFormState {
    status: ChecklistTemplateFormStatus;
    message?: string;
    fieldErrors?: FieldErrors<ChecklistTemplateDeleteFormValues>;
    values: ChecklistTemplateDeleteFormValues;
}

export function buildInitialChecklistTemplateDeleteFormState(
    values: ChecklistTemplateDeleteFormValues,
): ChecklistTemplateDeleteFormState {
    return { status: 'idle', values };
}
