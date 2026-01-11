export interface BillingPaymentMethodActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export interface BillingSetupIntentState extends BillingPaymentMethodActionState {
    clientSecret?: string;
}

export const initialBillingPaymentMethodActionState: BillingPaymentMethodActionState = {
    status: 'idle',
    message: undefined,
};

export const initialBillingSetupIntentState: BillingSetupIntentState = {
    status: 'idle',
    message: undefined,
    clientSecret: undefined,
};
