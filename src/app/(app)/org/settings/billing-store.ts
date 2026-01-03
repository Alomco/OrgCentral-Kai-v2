import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
  CACHE_SCOPE_BILLING_INVOICES,
  CACHE_SCOPE_BILLING_PAYMENT_METHODS,
  CACHE_SCOPE_BILLING_SUBSCRIPTION,
  CACHE_SCOPE_BILLING_UPCOMING,
} from '@/server/repositories/cache-scopes';
import type { BillingInvoiceData, OrganizationSubscriptionData, PaymentMethodData } from '@/server/types/billing-types';
import { getBillingSubscription } from '@/server/use-cases/billing/get-billing-subscription';
import { listBillingPaymentMethods } from '@/server/use-cases/billing/list-billing-payment-methods';
import { listBillingInvoices } from '@/server/use-cases/billing/list-billing-invoices';
import { getUpcomingBillingInvoice } from '@/server/use-cases/billing/get-upcoming-billing-invoice';
import type { BillingInvoicePreview } from '@/server/services/billing/billing-gateway';

export async function getBillingSubscriptionForUi(
  authorization: RepositoryAuthorizationContext,
): Promise<OrganizationSubscriptionData | null> {
  async function loadCached(input: RepositoryAuthorizationContext): Promise<OrganizationSubscriptionData | null> {
    'use cache';
    cacheLife('minutes');
    registerOrgCacheTag(
      input.orgId,
      CACHE_SCOPE_BILLING_SUBSCRIPTION,
      input.dataClassification,
      input.dataResidency,
    );
    const result = await getBillingSubscription({}, { authorization: input });
    return result.subscription;
  }

  if (authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    const result = await getBillingSubscription({}, { authorization });
    return result.subscription;
  }

  return loadCached(toCacheSafeAuthorizationContext(authorization));
}

export async function getBillingPaymentMethodsForUi(
  authorization: RepositoryAuthorizationContext,
): Promise<PaymentMethodData[]> {
  async function loadCached(input: RepositoryAuthorizationContext): Promise<PaymentMethodData[]> {
    'use cache';
    cacheLife('minutes');
    registerOrgCacheTag(
      input.orgId,
      CACHE_SCOPE_BILLING_PAYMENT_METHODS,
      input.dataClassification,
      input.dataResidency,
    );
    const result = await listBillingPaymentMethods({}, { authorization: input });
    return result.paymentMethods;
  }

  if (authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    const result = await listBillingPaymentMethods({}, { authorization });
    return result.paymentMethods;
  }

  return loadCached(toCacheSafeAuthorizationContext(authorization));
}

export async function getBillingInvoicesForUi(
  authorization: RepositoryAuthorizationContext,
): Promise<BillingInvoiceData[]> {
  async function loadCached(input: RepositoryAuthorizationContext): Promise<BillingInvoiceData[]> {
    'use cache';
    cacheLife('minutes');
    registerOrgCacheTag(
      input.orgId,
      CACHE_SCOPE_BILLING_INVOICES,
      input.dataClassification,
      input.dataResidency,
    );
    const result = await listBillingInvoices({}, { authorization: input, filters: { limit: 6 } });
    return result.invoices;
  }

  if (authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    const result = await listBillingInvoices({}, { authorization, filters: { limit: 6 } });
    return result.invoices;
  }

  return loadCached(toCacheSafeAuthorizationContext(authorization));
}

export async function getUpcomingInvoiceForUi(
  authorization: RepositoryAuthorizationContext,
): Promise<BillingInvoicePreview | null> {
  async function loadCached(input: RepositoryAuthorizationContext): Promise<BillingInvoicePreview | null> {
    'use cache';
    cacheLife('minutes');
    registerOrgCacheTag(
      input.orgId,
      CACHE_SCOPE_BILLING_UPCOMING,
      input.dataClassification,
      input.dataResidency,
    );
    const result = await getUpcomingBillingInvoice({}, { authorization: input });
    return result.upcomingInvoice;
  }

  if (authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    const result = await getUpcomingBillingInvoice({}, { authorization });
    return result.upcomingInvoice;
  }

  return loadCached(toCacheSafeAuthorizationContext(authorization));
}
