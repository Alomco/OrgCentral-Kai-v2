import type Stripe from 'stripe';

import type {
  BillingInvoicePreview,
  BillingInvoiceSnapshot,
  BillingPaymentMethodType,
  BillingSubscriptionSnapshot,
  PaymentMethodSummary,
} from '@/server/services/billing/billing-gateway';
import type { BillingConfig } from '@/server/services/billing/billing-config';
import type { BillingInvoiceStatus, BillingSubscriptionStatus, PaymentMethodType } from '@/server/types/billing-types';

const STATUS_MAP: Record<Stripe.Subscription.Status, BillingSubscriptionStatus> = {
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE_EXPIRED',
  trialing: 'TRIALING',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  unpaid: 'UNPAID',
  paused: 'PAUSED',
};

const INVOICE_STATUS_MAP: Record<Stripe.Invoice.Status, BillingInvoiceStatus> = {
  draft: 'DRAFT',
  open: 'OPEN',
  paid: 'PAID',
  void: 'VOID',
  uncollectible: 'UNCOLLECTIBLE',
};

export function buildSupportedPaymentMethodTypes(config: BillingConfig): BillingPaymentMethodType[] {
  const types: BillingPaymentMethodType[] = ['card'];
  if (config.stripeEnableBacsDebit) {
    types.push('bacs_debit');
  }
  if (config.stripeEnableSepaDebit) {
    types.push('sepa_debit');
  }
  return types;
}

export function toPaymentMethodSummary(
  method: Stripe.PaymentMethod,
  defaultPaymentMethodId?: string | null,
): PaymentMethodSummary {
  const mappedType = mapPaymentMethodType(method.type);
  if (method.type === 'card' && method.card) {
    return {
      stripePaymentMethodId: method.id,
      type: mappedType,
      last4: method.card.last4,
      brand: method.card.brand,
      expiryMonth: method.card.exp_month,
      expiryYear: method.card.exp_year,
      bankName: null,
      isDefault: defaultPaymentMethodId === method.id,
    };
  }

  if (method.type === 'bacs_debit' && method.bacs_debit) {
    const bacsBankName = (method.bacs_debit as { bank_name?: string | null }).bank_name ?? null;
    return {
      stripePaymentMethodId: method.id,
      type: mappedType,
      last4: method.bacs_debit.last4 ?? '0000',
      brand: null,
      bankName: bacsBankName,
      expiryMonth: null,
      expiryYear: null,
      isDefault: defaultPaymentMethodId === method.id,
    };
  }

  if (method.type === 'sepa_debit' && method.sepa_debit) {
    return {
      stripePaymentMethodId: method.id,
      type: mappedType,
      last4: method.sepa_debit.last4 ?? '0000',
      brand: null,
      bankName: method.sepa_debit.bank_code ?? null,
      expiryMonth: null,
      expiryYear: null,
      isDefault: defaultPaymentMethodId === method.id,
    };
  }

  return {
    stripePaymentMethodId: method.id,
    type: mappedType,
    last4: '0000',
    brand: null,
    bankName: null,
    expiryMonth: null,
    expiryYear: null,
    isDefault: defaultPaymentMethodId === method.id,
  };
}

export function toSubscriptionSnapshot(
  subscription: Stripe.Subscription,
  priceIds: Set<string>,
): BillingSubscriptionSnapshot {
  const item = subscription.items.data.find((entry) => priceIds.has(entry.price.id));
  if (!item) {
    throw new Error('Stripe subscription is missing the expected price item.');
  }

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const metadata = subscription.metadata;

  return {
    orgId: getMetadataValue(metadata, 'orgId'),
    userId: getMetadataValue(metadata, 'userId'),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionItemId: item.id,
    stripePriceId: item.price.id,
    status: STATUS_MAP[subscription.status],
    seatCount: item.quantity ?? 1,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    metadata,
  };
}

export function toInvoiceSnapshot(
  invoice: Stripe.Invoice,
  priceIds: Set<string>,
): BillingInvoiceSnapshot {
  const status = invoice.status ? INVOICE_STATUS_MAP[invoice.status] : 'DRAFT';
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription
        ? invoice.subscription.id
        : null;

  return {
    orgId: resolveInvoiceOrgId(invoice),
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    periodStart: new Date(invoice.period_start * 1000),
    periodEnd: new Date(invoice.period_end * 1000),
    userCount: resolveInvoiceSeatCount(invoice, priceIds),
    invoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    paidAt: invoice.status_transitions.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : null,
    metadata: invoice.metadata ?? null,
  };
}

export function toInvoicePreview(
  invoice: Stripe.Invoice | Stripe.UpcomingInvoice,
  priceIds: Set<string>,
): BillingInvoicePreview {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';

  return {
    stripeCustomerId: customerId,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    periodStart: new Date(invoice.period_start * 1000),
    periodEnd: new Date(invoice.period_end * 1000),
    userCount: resolveInvoiceSeatCount(invoice, priceIds),
  };
}

function getMetadataValue(metadata: Stripe.Metadata | null, key: string): string | null {
  if (!metadata) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(metadata, key) ? metadata[key] : null;
}

function resolveInvoiceSeatCount(invoice: Stripe.Invoice | Stripe.UpcomingInvoice, priceIds: Set<string>): number {
  const line = invoice.lines.data.find((entry) => entry.price && priceIds.has(entry.price.id));
  if (!line) {
    return 1;
  }
  return line.quantity ?? 1;
}

function resolveInvoiceOrgId(invoice: Stripe.Invoice): string | null {
  const metadataOrgId = getMetadataValue(invoice.metadata ?? null, 'orgId');
  if (metadataOrgId) {
    return metadataOrgId;
  }
  const subscriptionMetadata = invoice.subscription_details?.metadata;
  return getMetadataValue(subscriptionMetadata ?? null, 'orgId');
}

function mapPaymentMethodType(type: Stripe.PaymentMethod.Type): PaymentMethodType {
  if (type === 'bacs_debit') {
    return 'BACS_DEBIT';
  }
  if (type === 'sepa_debit') {
    return 'SEPA_DEBIT';
  }
  return 'CARD';
}
