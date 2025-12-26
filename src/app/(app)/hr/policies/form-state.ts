import type { AcknowledgePolicyFormValues } from './schema';

export type AcknowledgePolicyFormStatus = 'idle' | 'error';

export interface AcknowledgePolicyFormState {
    status: AcknowledgePolicyFormStatus;
    message?: string;
    values: AcknowledgePolicyFormValues;
}

export function buildInitialAcknowledgePolicyFormState(
    values: AcknowledgePolicyFormValues,
): AcknowledgePolicyFormState {
    return { status: 'idle', values };
}
