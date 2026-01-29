import { queryOptions } from '@tanstack/react-query';
import type { PaymentMethodData } from '@/server/types/billing-types';

export const billingKeys = {
  paymentMethods: (orgId: string) => ['org', orgId, 'billing', 'payment-methods'] as const,
} as const;

interface PaymentMethodsResponse {
  paymentMethods: PaymentMethodData[];
}

interface SetupIntentResponse {
  clientSecret: string;
}

function isPaymentMethodsResponse(value: unknown): value is PaymentMethodsResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { paymentMethods?: unknown };
  return Array.isArray(candidate.paymentMethods);
}

function isSetupIntentResponse(value: unknown): value is SetupIntentResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { clientSecret?: unknown };
  return typeof candidate.clientSecret === 'string';
}

export function listPaymentMethodsQuery(orgId: string) {
  return queryOptions({
    queryKey: billingKeys.paymentMethods(orgId),
    queryFn: async (): Promise<PaymentMethodData[]> => {
      const res = await fetch(`/api/org/${orgId}/billing/payment-methods`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load payment methods');
      }
      const data: unknown = await res.json();
      if (!isPaymentMethodsResponse(data)) {
        throw new Error('Invalid payment methods response');
      }
      return data.paymentMethods;
    },
    staleTime: 30_000,
  });
}

export async function createSetupIntent(orgId: string): Promise<{ clientSecret: string }> {
  const res = await fetch(`/api/org/${orgId}/billing/setup-intent`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to create setup intent');
  }
  const data: unknown = await res.json();
  if (!isSetupIntentResponse(data)) {
    throw new Error('Invalid setup intent response');
  }
  return data;
}

export async function setDefaultPaymentMethod(orgId: string, paymentMethodId: string): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/billing/payment-methods/${paymentMethodId}/default`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to set default');
  }
}

export async function removePaymentMethod(orgId: string, paymentMethodId: string): Promise<void> {
  const res = await fetch(`/api/org/${orgId}/billing/payment-methods/${paymentMethodId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to remove payment method');
  }
}