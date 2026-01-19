"use client";

import { useActionState, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PaymentMethodData } from '@/server/types/billing-types';
import {
  createSetupIntentAction,
  removePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from '../billing-payment-method-actions';
import {
  initialBillingPaymentMethodActionState,
  initialBillingSetupIntentState,
} from '../billing-payment-method-actions.state';

interface BillingPaymentMethodsClientProps {
  paymentMethods: PaymentMethodData[];
  canManage: boolean;
  publishableKey: string;
}

export function BillingPaymentMethodsClient({
  paymentMethods,
  canManage,
  publishableKey,
}: BillingPaymentMethodsClientProps) {
  const router = useRouter();
  const [setupState, setupAction, setupPending] = useActionState(
    createSetupIntentAction,
    initialBillingSetupIntentState,
  );
  const [defaultState, defaultAction, defaultPending] = useActionState(
    setDefaultPaymentMethodAction,
    initialBillingPaymentMethodActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removePaymentMethodAction,
    initialBillingPaymentMethodActionState,
  );
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  const [completedClientSecret, setCompletedClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (defaultState.status === 'success' || removeState.status === 'success') {
      router.refresh();
    }
  }, [defaultState.status, removeState.status, router]);

  const feedback = [setupState, defaultState, removeState]
    .filter((state) => state.status !== 'idle' && state.message)
    .map((state) => state.message)
    .join(' ');

  return (
    <div className="mt-4 space-y-4">
      {paymentMethods.length ? (
        <div className="space-y-2">
          {paymentMethods.map((method) => (
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
                    {method.isDefault ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPaymentMethodMeta(method)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!method.isDefault ? (
                  <form action={defaultAction}>
                    <input type="hidden" name="paymentMethodId" value={method.stripePaymentMethodId} />
                    <Button type="submit" size="sm" variant="outline" disabled={defaultPending}>
                      Set default
                    </Button>
                  </form>
                ) : null}
                <form action={removeAction}>
                  <input type="hidden" name="paymentMethodId" value={method.stripePaymentMethodId} />
                  <Button type="submit" size="sm" variant="ghost" disabled={removePending}>
                    Remove
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No payment methods saved yet.</p>
      )}

      {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}

      <form action={setupAction} className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={!canManage || setupPending || !publishableKey}>
          Add payment method
        </Button>
        {!publishableKey ? (
          <span className="text-xs text-muted-foreground">
            Stripe publishable key missing.
          </span>
        ) : null}
        {!canManage ? (
          <span className="text-xs text-muted-foreground">
            Subscribe to enable payment methods.
          </span>
        ) : null}
      </form>

      {setupState.clientSecret && stripePromise && completedClientSecret !== setupState.clientSecret ? (
        <Elements stripe={stripePromise} options={buildStripeOptions(setupState.clientSecret)}>
          <PaymentMethodSetupForm
            onComplete={() => {
              setCompletedClientSecret(setupState.clientSecret ?? null);
              router.refresh();
            }}
          />
        </Elements>
      ) : null}
      {completedClientSecret === setupState.clientSecret && setupState.clientSecret ? (
        <p className="text-xs text-muted-foreground">Payment method added. Refreshing details...</p>
      ) : null}
    </div>
  );
}

function PaymentMethodSetupForm({ onComplete }: { onComplete: () => void }) {
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
    onComplete();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border bg-background p-4"
    >
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
    appearance: {
      theme: 'stripe',
    },
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
