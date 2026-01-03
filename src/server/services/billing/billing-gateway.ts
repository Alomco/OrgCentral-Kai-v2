import type {
  BillingInvoiceStatus,
  BillingSubscriptionStatus,
  PaymentMethodType,
} from '@/server/types/billing-types';

export interface BillingCheckoutSessionInput {
  orgId: string;
  userId: string;
  customerEmail?: string | null;
  seatCount: number;
  successUrl: string;
  cancelUrl: string;
  priceId: string;
}

export interface BillingCheckoutSessionResult {
  id: string;
  url: string;
}

export interface BillingPortalSessionInput {
  customerId: string;
  returnUrl: string;
}

export interface BillingPortalSessionResult {
  url: string;
}

export type BillingPaymentMethodType = 'card' | 'bacs_debit' | 'sepa_debit';

export interface BillingSetupIntentInput {
  customerId: string;
  paymentMethodTypes: BillingPaymentMethodType[];
}

export interface BillingSetupIntentResult {
  clientSecret: string;
}

export interface PaymentMethodSummary {
  stripePaymentMethodId: string;
  type: PaymentMethodType;
  last4: string;
  brand?: string | null;
  bankName?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault: boolean;
}

export interface BillingSubscriptionSnapshot {
  orgId?: string | null;
  userId?: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string | null;
  stripePriceId: string;
  status: BillingSubscriptionStatus;
  seatCount: number;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, string> | null;
}

export interface BillingInvoiceSnapshot {
  orgId?: string | null;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  status: BillingInvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  userCount: number;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
  paidAt?: Date | null;
  metadata?: Record<string, string> | null;
}

export interface BillingInvoicePreview {
  stripeCustomerId: string;
  amountDue: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  userCount: number;
}

export type BillingProrationBehavior = 'create_prorations' | 'always_invoice' | 'none';

export interface BillingSubscriptionUpdateInput {
  subscriptionId: string;
  subscriptionItemId?: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  prorationBehavior?: BillingProrationBehavior;
  idempotencyKey?: string;
}

export type BillingWebhookEvent =
  | { type: 'subscription.created'; subscription: BillingSubscriptionSnapshot; stripeEventCreatedAt: Date }
  | { type: 'subscription.updated'; subscription: BillingSubscriptionSnapshot; stripeEventCreatedAt: Date }
  | { type: 'subscription.deleted'; subscription: BillingSubscriptionSnapshot; stripeEventCreatedAt: Date }
  | { type: 'invoice.created'; invoice: BillingInvoiceSnapshot; stripeEventCreatedAt: Date }
  | { type: 'invoice.finalized'; invoice: BillingInvoiceSnapshot; stripeEventCreatedAt: Date }
  | { type: 'invoice.paid'; invoice: BillingInvoiceSnapshot; stripeEventCreatedAt: Date }
  | {
      type: 'invoice.payment_failed';
      invoice: BillingInvoiceSnapshot;
      failureReason?: string | null;
      stripeEventCreatedAt: Date;
    }
  | { type: 'invoice.upcoming'; invoice: BillingInvoiceSnapshot; stripeEventCreatedAt: Date }
  | {
      type: 'payment_method.attached';
      paymentMethod: PaymentMethodSummary;
      stripeCustomerId: string;
    }
  | { type: 'payment_method.detached'; paymentMethodId: string; stripeCustomerId: string }
  | { type: 'setup_intent.succeeded'; stripeCustomerId: string; paymentMethodId: string }
  | { type: 'checkout.completed'; session: { orgId?: string | null; userId?: string | null } }
  | { type: 'ignored'; eventType: string };

export interface BillingGateway {
  createCheckoutSession(input: BillingCheckoutSessionInput): Promise<BillingCheckoutSessionResult>;
  createSetupIntent(input: BillingSetupIntentInput): Promise<BillingSetupIntentResult>;
  listPaymentMethods(customerId: string): Promise<PaymentMethodSummary[]>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(input: { customerId: string; paymentMethodId: string }): Promise<void>;
  previewUpcomingInvoice(customerId: string): Promise<BillingInvoicePreview | null>;
  createPortalSession(input: BillingPortalSessionInput): Promise<BillingPortalSessionResult>;
  updateSubscription(input: BillingSubscriptionUpdateInput): Promise<void>;
  updateSubscriptionSeats(input: {
    subscriptionItemId: string;
    seatCount: number;
    prorationBehavior?: BillingProrationBehavior;
    idempotencyKey?: string;
  }): Promise<void>;
  parseWebhookEvent(input: { signature: string; payload: string }): BillingWebhookEvent;
}
