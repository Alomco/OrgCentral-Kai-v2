"use server";

import { headers } from 'next/headers';
import { z } from 'zod';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_BILLING_SUBSCRIPTION } from '@/server/repositories/cache-scopes';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type { BillingSettingsState } from './_components/billing-settings-form';
import { resolveBillingService } from '@/server/services/billing/billing-service.provider';
import { updateOrgSettings } from './settings-store';

const trimmedEmailOrEmptySchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.email(), z.literal('')]),
);

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.string().min(1), z.literal('')]),
);

const billingAddressSchema = z.object({
  line1: z.string().trim().min(1).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  postcode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(2).default('GB'),
});

const billingSettingsFormSchema = z
  .object({
    billingEmail: trimmedEmailOrEmptySchema,
    billingCadence: z.enum(['monthly', 'annual']),
    autoRenew: z.boolean(),
    invoicePrefix: optionalTextSchema.optional(),
    vatNumber: optionalTextSchema.optional(),
    billingAddress: billingAddressSchema.optional(),
  })
  .strict();

export async function updateBillingSettings(
  previous: BillingSettingsState,
  formData: FormData,
): Promise<BillingSettingsState> {
  const headerStore = await headers();
  const billingEmailValue = readFormString(formData, 'billing-email');
  const billingCadenceValue = readFormString(formData, 'billing-cadence');
  const invoicePrefixValue = readFormString(formData, 'billing-invoice-prefix');
  const vatNumberValue = readFormString(formData, 'billing-vat-number');
  const address = buildBillingAddress(formData);

  const parsed = billingSettingsFormSchema.safeParse({
    billingEmail: billingEmailValue,
    billingCadence: billingCadenceValue || 'monthly',
    autoRenew: formData.get('billing-auto-renew') === 'on',
    invoicePrefix: invoicePrefixValue || undefined,
    vatNumber: vatNumberValue || undefined,
    billingAddress: address,
  });

  if (!parsed.success) {
    return { ...previous, status: 'error', message: 'Invalid billing settings.' };
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['manage'] },
      auditSource: 'ui:org-settings:billing',
    },
  );

  const billingEmail = parsed.data.billingEmail.trim();
  const invoicePrefix = normalizeOptionalField(parsed.data.invoicePrefix);
  const vatNumber = normalizeOptionalField(parsed.data.vatNumber);

  await updateOrgSettings(authorization, {
    billing: {
      billingEmail,
      billingCadence: parsed.data.billingCadence,
      autoRenew: parsed.data.autoRenew,
      invoicePrefix,
      vatNumber,
      billingAddress: parsed.data.billingAddress,
    },
  });

  const billingService = resolveBillingService();
  if (billingService) {
    try {
      await billingService.syncSubscriptionPreferences({
        authorization,
        billingCadence: parsed.data.billingCadence,
        autoRenew: parsed.data.autoRenew,
      });
      await invalidateOrgCache(
        authorization.orgId,
        CACHE_SCOPE_BILLING_SUBSCRIPTION,
        authorization.dataClassification,
        authorization.dataResidency,
      );
    } catch {
      return {
        status: 'error',
        message: 'Saved billing settings, but Stripe could not be updated. Retry or use the billing portal.',
        billingEmail,
        billingCadence: parsed.data.billingCadence,
        autoRenew: parsed.data.autoRenew,
        invoicePrefix,
        vatNumber,
        billingAddress: parsed.data.billingAddress,
      };
    }
  }

  return {
    status: 'success',
    message: 'Billing settings updated.',
    billingEmail,
    billingCadence: parsed.data.billingCadence,
    autoRenew: parsed.data.autoRenew,
    invoicePrefix,
    vatNumber,
    billingAddress: parsed.data.billingAddress,
  };
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalField(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.trim() || undefined;
}

function buildBillingAddress(formData: FormData): BillingSettingsState['billingAddress'] | undefined {
  const line1 = readFormString(formData, 'billing-address-line1');
  const line2 = readFormString(formData, 'billing-address-line2');
  const city = readFormString(formData, 'billing-address-city');
  const postcode = readFormString(formData, 'billing-address-postcode');
  const country = readFormString(formData, 'billing-address-country') || 'GB';

  if (!line1 && !city && !postcode) {
    return undefined;
  }

  return {
    line1,
    line2: line2 || undefined,
    city,
    postcode,
    country: country.toUpperCase(),
  };
}
