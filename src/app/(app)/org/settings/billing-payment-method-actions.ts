"use server";

import { headers } from 'next/headers';
import { z } from 'zod';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_BILLING_PAYMENT_METHODS } from '@/server/repositories/cache-scopes';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createBillingSetupIntent } from '@/server/use-cases/billing/create-billing-setup-intent';
import { setDefaultBillingPaymentMethod } from '@/server/use-cases/billing/set-default-billing-payment-method';
import { removeBillingPaymentMethod } from '@/server/use-cases/billing/remove-billing-payment-method';

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

const paymentMethodActionSchema = z
  .object({
    paymentMethodId: z.string().trim().min(1),
  })
  .strict();

const setupIntentSchema = z.object({}).strict();

export async function createSetupIntentAction(
  previous: BillingSetupIntentState,
): Promise<BillingSetupIntentState> {
  setupIntentSchema.parse({});
  const headerStore = await headers();

  const { authorization } = await getSessionContext(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'ui:org-settings:billing:setup-intent',
    },
  );

  try {
    const result = await createBillingSetupIntent({}, { authorization });
    return {
      status: 'success',
      message: 'Payment method ready.',
      clientSecret: result.clientSecret,
    };
  } catch {
    return {
      ...previous,
      status: 'error',
      message: 'Unable to start payment method setup.',
      clientSecret: undefined,
    };
  }
}

export async function setDefaultPaymentMethodAction(
  previous: BillingPaymentMethodActionState,
  formData: FormData,
): Promise<BillingPaymentMethodActionState> {
  const parsed = paymentMethodActionSchema.safeParse({
    paymentMethodId: readFormString(formData, 'paymentMethodId'),
  });
  if (!parsed.success) {
    return { ...previous, status: 'error', message: 'Invalid payment method.' };
  }

  const headerStore = await headers();
  const { authorization } = await getSessionContext(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'ui:org-settings:billing:payment-method-default',
    },
  );

  try {
    await setDefaultBillingPaymentMethod({}, { authorization, paymentMethodId: parsed.data.paymentMethodId });
    await invalidateOrgCache(
      authorization.orgId,
      CACHE_SCOPE_BILLING_PAYMENT_METHODS,
      authorization.dataClassification,
      authorization.dataResidency,
    );
    return { status: 'success', message: 'Default payment method updated.' };
  } catch {
    return { status: 'error', message: 'Unable to update default payment method.' };
  }
}

export async function removePaymentMethodAction(
  previous: BillingPaymentMethodActionState,
  formData: FormData,
): Promise<BillingPaymentMethodActionState> {
  const parsed = paymentMethodActionSchema.safeParse({
    paymentMethodId: readFormString(formData, 'paymentMethodId'),
  });
  if (!parsed.success) {
    return { ...previous, status: 'error', message: 'Invalid payment method.' };
  }

  const headerStore = await headers();
  const { authorization } = await getSessionContext(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'ui:org-settings:billing:payment-method-remove',
    },
  );

  try {
    await removeBillingPaymentMethod({}, { authorization, paymentMethodId: parsed.data.paymentMethodId });
    await invalidateOrgCache(
      authorization.orgId,
      CACHE_SCOPE_BILLING_PAYMENT_METHODS,
      authorization.dataClassification,
      authorization.dataResidency,
    );
    return { status: 'success', message: 'Payment method removed.' };
  } catch {
    return { status: 'error', message: 'Unable to remove payment method.' };
  }
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}
