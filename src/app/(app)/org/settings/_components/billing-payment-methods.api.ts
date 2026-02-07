import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import type { PaymentMethodData } from '@/server/types/billing-types';
import { BILLING_PAYMENT_METHOD_TYPES } from '@/server/types/billing-types';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';

export const billingKeys = {
  paymentMethods: (orgId: string) => ['org', orgId, 'billing', 'payment-methods'] as const,
} as const;

const paymentMethodSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  stripePaymentMethodId: z.string(),
  type: z.enum(BILLING_PAYMENT_METHOD_TYPES),
  last4: z.string(),
  brand: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  expiryMonth: z.number().int().nullable().optional(),
  expiryYear: z.number().int().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES),
  auditSource: z.string(),
  auditBatchId: z.string().optional(),
});

const paymentMethodsResponseSchema = z.object({
  success: z.literal(true),
  paymentMethods: z.array(paymentMethodSchema),
  billingConfigured: z.boolean(),
});

const setupIntentResponseSchema = z.object({
  success: z.literal(true),
  clientSecret: z.string(),
});

export interface BillingPaymentMethodsQueryResult {
  paymentMethods: PaymentMethodData[];
  billingConfigured: boolean;
}

export function listPaymentMethodsQuery(orgId: string) {
  return queryOptions({
    queryKey: billingKeys.paymentMethods(orgId),
    queryFn: async (): Promise<BillingPaymentMethodsQueryResult> => {
      const res = await fetch(`/api/org/${orgId}/billing/payment-methods`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load payment methods');
      }
      const data = paymentMethodsResponseSchema.parse(await res.json());
      return {
        paymentMethods: data.paymentMethods,
        billingConfigured: data.billingConfigured,
      };
    },
    staleTime: 30_000,
  });
}

export async function createSetupIntent(orgId: string): Promise<{ clientSecret: string }> {
  const res = await fetch(`/api/org/${orgId}/billing/setup-intent`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to create setup intent');
  }
  const data = setupIntentResponseSchema.parse(await res.json());
  return { clientSecret: data.clientSecret };
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
