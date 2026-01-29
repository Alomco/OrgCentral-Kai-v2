"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentMethodData } from '@/server/types/billing-types';
import {
  billingKeys,
  createSetupIntent,
  listPaymentMethodsQuery,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from './billing-payment-methods.api';

interface BillingPaymentMethodsClientProps {
  orgId: string;
  paymentMethods: PaymentMethodData[];
  canManage: boolean;
  publishableKey: string;
}

export function BillingPaymentMethodsClient({
  orgId,
  paymentMethods,
  canManage,
  publishableKey,
}: BillingPaymentMethodsClientProps) {
  const queryClient = useQueryClient();

  // Query payment methods with initial SSR data
  const { data } = useQuery({ ...listPaymentMethodsQuery(orgId), initialData: paymentMethods });
  const methods = data;

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  const [completedClientSecret, setCompletedClientSecret] = useState<string | null>(null);

  const setupIntent = useMutation({
    mutationFn: () => createSetupIntent(orgId),
  });

  const setDefault = useMutation({
    mutationFn: (pmId: string) => setDefaultPaymentMethod(orgId, pmId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods(orgId) });
    },
  });

  const remove = useMutation({
    mutationFn: (pmId: string) => removePaymentMethod(orgId, pmId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods(orgId) });
    },
  });

  const feedback = [setupIntent.error?.message, setDefault.error?.message, remove.error?.message]
    .filter(Boolean)
    .join(' ');

  const clientSecret = setupIntent.data?.clientSecret ?? null;
  const showSetupForm = Boolean(
    clientSecret && stripePromise && completedClientSecret !== clientSecret,
  );

  const handleCreateSetupIntent = () => {
    setupIntent.mutate(undefined, {
      onSuccess: () => setCompletedClientSecret(null),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      {methods.length ? (
        <div className="space-y-2">
          {methods.map((method) => (
            <div
              key={method.stripePaymentMethodId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPaymentMethodTitle(method)}
                    </p>
                    {method.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatPaymentMethodMeta(method)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!method.isDefault ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={setDefault.isPending}
                    onClick={async () => {
                      await setDefault.mutateAsync(method.stripePaymentMethodId);
                    }}
                  >
                    {setDefault.isPending ? <Spinner className="mr-2" /> : null}
                    Set default
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={async () => {
                    await remove.mutateAsync(method.stripePaymentMethodId);
                  }}
                >
                  {remove.isPending ? <Spinner className="mr-2" /> : null}
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No payment methods saved yet.</p>
      )}

      {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={!canManage || setupIntent.isPending || !publishableKey}
          onClick={handleCreateSetupIntent}
        >
          {setupIntent.isPending ? <Spinner className="mr-2" /> : null}
          Add payment method
        </Button>
        {!publishableKey ? (
          <span className="text-xs text-muted-foreground">Stripe publishable key missing.</span>
        ) : null}
        {!canManage ? (
          <span className="text-xs text-muted-foreground">Subscribe to enable payment methods.</span>
        ) : null}
      </div>

      {showSetupForm && clientSecret ? (
        <Elements stripe={stripePromise} options={buildStripeOptions(clientSecret)}>
          <PaymentMethodSetupForm
            onComplete={async () => {
              setCompletedClientSecret(clientSecret);
              await queryClient.invalidateQueries({ queryKey: billingKeys.paymentMethods(orgId) });
            }}
          />
        </Elements>
      ) : null}
      {clientSecret && completedClientSecret === clientSecret ? (
        <p className="text-xs text-muted-foreground">Payment method added. Refreshing details...</p>
      ) : null}
    </div>
  );
}

function PaymentMethodSetupForm({ onComplete }: { onComplete: () => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setStatus('saving');
    setMessage(null);

    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      setMessage(result.error.message ?? 'Payment method setup failed.');
      setStatus('idle');
      return;
    }

    setStatus('idle');
    await onComplete();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-background p-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={status === 'saving' || !stripe || !elements}>
          Save payment method
        </Button>
        {message ? <span className="text-xs text-destructive">{message}</span> : null}
      </div>
    </form>
  );
}

function buildStripeOptions(clientSecret: string): StripeElementsOptions {
  return {
    clientSecret,
    appearance: { theme: 'stripe' },
  };
}

function formatPaymentMethodTitle(method: PaymentMethodData): string {
  switch (method.type) {
    case 'CARD':
      return `${method.brand ?? 'Card'} **** ${method.last4}`;
    case 'BACS_DEBIT':
      return `BACS **** ${method.last4}`;
    case 'SEPA_DEBIT':
      return `SEPA **** ${method.last4}`;
    default:
      return `Payment **** ${method.last4}`;
  }
}

function formatPaymentMethodMeta(method: PaymentMethodData): string {
  switch (method.type) {
    case 'CARD':
      if (method.expiryMonth && method.expiryYear) {
        return `Expires ${String(method.expiryMonth).padStart(2, '0')}/${String(method.expiryYear).slice(-2)}`;
      }
      return 'Card payment method';
    case 'BACS_DEBIT':
      return method.bankName ? `Bank: ${method.bankName}` : 'UK Direct Debit';
    case 'SEPA_DEBIT':
      return 'SEPA Direct Debit';
    default:
      return 'Saved payment method';
  }
}