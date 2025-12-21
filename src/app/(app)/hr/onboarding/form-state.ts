import type { OnboardingInviteFormValues } from './schema';

export type OnboardingInviteFormStatus = 'idle' | 'success' | 'error';

export interface OnboardingInviteFormState {
    status: OnboardingInviteFormStatus;
    message?: string;
    token?: string;
    values: OnboardingInviteFormValues;
}

export function buildInitialOnboardingInviteFormState(
    values: OnboardingInviteFormValues,
): OnboardingInviteFormState {
    return { status: 'idle', values };
}
