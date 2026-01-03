import type { OrgId, TenantMetadata } from './tenant';
import type { TimestampString } from './leave-types';

export const BILLING_SUBSCRIPTION_STATUSES = [
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'PAUSED',
] as const;

export type BillingSubscriptionStatus = (typeof BILLING_SUBSCRIPTION_STATUSES)[number];

export const BILLING_PAYMENT_METHOD_TYPES = ['CARD', 'BACS_DEBIT', 'SEPA_DEBIT'] as const;
export type PaymentMethodType = (typeof BILLING_PAYMENT_METHOD_TYPES)[number];

export const BILLING_INVOICE_STATUSES = ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'] as const;
export type BillingInvoiceStatus = (typeof BILLING_INVOICE_STATUSES)[number];

export interface OrganizationSubscriptionData extends TenantMetadata {
  id: string;
  orgId: OrgId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string | null;
  stripePriceId: string;
  status: BillingSubscriptionStatus;
  seatCount: number;
  currentPeriodEnd?: TimestampString | null;
  cancelAtPeriodEnd: boolean;
  lastStripeEventAt?: TimestampString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface PaymentMethodData extends TenantMetadata {
  id: string;
  orgId: OrgId;
  stripePaymentMethodId: string;
  type: PaymentMethodType;
  last4: string;
  brand?: string | null;
  bankName?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault: boolean;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface BillingInvoiceData extends TenantMetadata {
  id: string;
  orgId: OrgId;
  stripeInvoiceId: string;
  status: BillingInvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  periodStart: TimestampString;
  periodEnd: TimestampString;
  userCount: number;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
  paidAt?: TimestampString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}
