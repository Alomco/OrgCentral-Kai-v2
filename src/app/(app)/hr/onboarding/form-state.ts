import type { OnboardingInviteFormValues } from './schema';
import type { FieldErrors } from '../_components/form-errors';

export type OnboardingInviteFormStatus = 'idle' | 'success' | 'error';

export interface OnboardingInviteFormState {
    status: OnboardingInviteFormStatus;
    message?: string;
    token?: string;
    fieldErrors?: FieldErrors<OnboardingInviteFormValues>;
    values: OnboardingInviteFormValues;
}

export function buildInitialOnboardingInviteFormState(
    values: OnboardingInviteFormValues,
): OnboardingInviteFormState {
    return { status: 'idle', values };
}

export type OnboardingRevokeInviteFormStatus = 'idle' | 'error';

export interface OnboardingRevokeInviteFormValues {
    token: string;
}

export interface OnboardingRevokeInviteFormState {
    status: OnboardingRevokeInviteFormStatus;
    message?: string;
    values: OnboardingRevokeInviteFormValues;
}

export function buildInitialOnboardingRevokeInviteFormState(
    values: OnboardingRevokeInviteFormValues,
): OnboardingRevokeInviteFormState {
    return { status: 'idle', values };
}
