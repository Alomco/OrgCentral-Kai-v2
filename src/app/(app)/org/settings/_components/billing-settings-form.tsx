'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

export interface BillingSettingsState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    billingEmail: string;
    billingCadence: 'monthly' | 'annual';
    autoRenew: boolean;
    invoicePrefix?: string;
    vatNumber?: string;
    billingAddress?: BillingAddressState;
}

export interface BillingAddressState {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
}

export const initialBillingSettingsState: BillingSettingsState = {
    status: 'idle',
    billingEmail: '',
    billingCadence: 'monthly',
    autoRenew: true,
    invoicePrefix: '',
    vatNumber: '',
    billingAddress: undefined,
};

export function BillingSettingsForm({
    action,
    defaultSettings,
}: {
    action: (state: BillingSettingsState, formData: FormData) => Promise<BillingSettingsState>;
    defaultSettings: Omit<BillingSettingsState, 'status' | 'message'>;
}) {
    const [state, formAction] = useActionState(action, {
        ...initialBillingSettingsState,
        ...defaultSettings,
    });

    return (
        <form action={formAction} className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.12)] p-6 backdrop-blur">
            <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Billing preferences</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Configure billing contacts and per-employee subscription cadence.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Billing email</span>
                    <input
                        type="email"
                        name="billing-email"
                        defaultValue={state.billingEmail}
                        placeholder="billing@company.com"
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    />
                </label>
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Billing cadence</span>
                    <select
                        name="billing-cadence"
                        defaultValue={state.billingCadence}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Auto-renew</span>
                    <input
                        type="checkbox"
                        name="billing-auto-renew"
                        key={state.autoRenew ? 'enabled' : 'disabled'}
                        defaultChecked={state.autoRenew}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Invoice prefix</span>
                    <input
                        type="text"
                        name="billing-invoice-prefix"
                        defaultValue={state.invoicePrefix ?? ''}
                        placeholder="ACME-"
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    />
                </label>
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">VAT number</span>
                    <input
                        type="text"
                        name="billing-vat-number"
                        defaultValue={state.vatNumber ?? ''}
                        placeholder="GB123456789"
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    />
                </label>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Billing address</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Line 1</span>
                        <input
                            type="text"
                            name="billing-address-line1"
                            defaultValue={state.billingAddress?.line1 ?? ''}
                            className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Line 2</span>
                        <input
                            type="text"
                            name="billing-address-line2"
                            defaultValue={state.billingAddress?.line2 ?? ''}
                            className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">City</span>
                        <input
                            type="text"
                            name="billing-address-city"
                            defaultValue={state.billingAddress?.city ?? ''}
                            className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Postcode</span>
                        <input
                            type="text"
                            name="billing-address-postcode"
                            defaultValue={state.billingAddress?.postcode ?? ''}
                            className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                        />
                    </label>
                    <label className="flex flex-col gap-2 sm:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Country</span>
                        <input
                            type="text"
                            name="billing-address-country"
                            defaultValue={state.billingAddress?.country ?? 'GB'}
                            className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                        />
                    </label>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                <span>{state.status === 'success' ? state.message ?? 'Saved' : 'Changes apply immediately'}</span>
            </div>
            <Button type="submit" size="sm" className="px-4">
                Save
            </Button>
            {state.status === 'error' ? (
                <p className="text-xs text-red-500" role="alert">
                    {state.message ?? 'Unable to save'}
                </p>
            ) : null}
        </form>
    );
}
