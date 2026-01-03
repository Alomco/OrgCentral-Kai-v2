import type Stripe from 'stripe';

import type { BillingWebhookEvent } from '@/server/services/billing/billing-gateway';
import {
  toInvoiceSnapshot,
  toPaymentMethodSummary,
  toSubscriptionSnapshot,
} from '@/server/services/billing/stripe-billing-gateway.mappers';

const PAYMENT_METHOD_ATTACHED = 'payment_method.attached';
const PAYMENT_METHOD_DETACHED = 'payment_method.detached';

export function parseStripeWebhookEvent(input: {
  stripe: Stripe;
  webhookSecret: string;
  priceIds: Set<string>;
  signature: string;
  payload: string;
}): BillingWebhookEvent {
  const event = input.stripe.webhooks.constructEvent(
    input.payload,
    input.signature,
    input.webhookSecret,
  );

  const checkoutEvent = handleCheckoutEvent(event);
  if (checkoutEvent) {
    return checkoutEvent;
  }

  const subscriptionEvent = handleSubscriptionEvent(event, input.priceIds);
  if (subscriptionEvent) {
    return subscriptionEvent;
  }

  const invoiceEvent = handleInvoiceEvent(event, input.priceIds);
  if (invoiceEvent) {
    return invoiceEvent;
  }

  const paymentMethodEvent = handlePaymentMethodEvent(event);
  if (paymentMethodEvent) {
    return paymentMethodEvent;
  }

  const setupIntentEvent = handleSetupIntentEvent(event);
  if (setupIntentEvent) {
    return setupIntentEvent;
  }

  return { type: 'ignored', eventType: event.type };
}

function getMetadataValue(metadata: Stripe.Metadata | null, key: string): string | null {
  if (!metadata) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(metadata, key) ? metadata[key] : null;
}

type PaymentMethodPreviousAttributes = Stripe.Event.Data.PreviousAttributes & {
  customer?: string | null;
};

function isPaymentIntent(value: unknown): value is Stripe.PaymentIntent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'last_payment_error' in value;
}

function handleCheckoutEvent(event: Stripe.Event): BillingWebhookEvent | null {
  if (event.type !== 'checkout.session.completed') {
    return null;
  }

  const sessionObject = event.data.object;
  if (!isCheckoutSessionObject(sessionObject)) {
    return null;
  }

  const metadata = sessionObject.metadata;
  const clientReferenceId = sessionObject.client_reference_id;
  return {
    type: 'checkout.completed',
    session: {
      orgId: getMetadataValue(metadata, 'orgId') ?? clientReferenceId,
      userId: getMetadataValue(metadata, 'userId'),
    },
  };
}

function handleSubscriptionEvent(
  event: Stripe.Event,
  priceIds: Set<string>,
): BillingWebhookEvent | null {
  if (!event.type.startsWith('customer.subscription.')) {
    return null;
  }

  const subscriptionObject = event.data.object;
  if (!isSubscriptionObject(subscriptionObject)) {
    return null;
  }

  const snapshot = toSubscriptionSnapshot(subscriptionObject, priceIds);
  const createdAt = new Date(event.created * 1000);

  if (event.type === 'customer.subscription.created') {
    return { type: 'subscription.created', subscription: snapshot, stripeEventCreatedAt: createdAt };
  }
  if (event.type === 'customer.subscription.updated') {
    return { type: 'subscription.updated', subscription: snapshot, stripeEventCreatedAt: createdAt };
  }
  if (event.type === 'customer.subscription.deleted') {
    return { type: 'subscription.deleted', subscription: snapshot, stripeEventCreatedAt: createdAt };
  }

  return null;
}

function handleInvoiceEvent(
  event: Stripe.Event,
  priceIds: Set<string>,
): BillingWebhookEvent | null {
  if (!event.type.startsWith('invoice.')) {
    return null;
  }

  const invoiceObject = event.data.object;
  if (!isInvoiceObject(invoiceObject)) {
    return null;
  }

  const snapshot = toInvoiceSnapshot(invoiceObject, priceIds);
  const createdAt = new Date(event.created * 1000);

  if (event.type === 'invoice.created') {
    return { type: 'invoice.created', invoice: snapshot, stripeEventCreatedAt: createdAt };
  }
  if (event.type === 'invoice.finalized') {
    return { type: 'invoice.finalized', invoice: snapshot, stripeEventCreatedAt: createdAt };
  }
  if (event.type === 'invoice.paid') {
    return { type: 'invoice.paid', invoice: snapshot, stripeEventCreatedAt: createdAt };
  }
  if (event.type === 'invoice.payment_failed') {
    const paymentIntent: Stripe.PaymentIntent | null = isPaymentIntent(invoiceObject.payment_intent)
      ? invoiceObject.payment_intent
      : null;
    const failureReason = paymentIntent?.last_payment_error?.message ?? null;
    return {
      type: 'invoice.payment_failed',
      invoice: snapshot,
      failureReason,
      stripeEventCreatedAt: createdAt,
    };
  }
  if (event.type === 'invoice.upcoming') {
    return { type: 'invoice.upcoming', invoice: snapshot, stripeEventCreatedAt: createdAt };
  }

  return null;
}

function handlePaymentMethodEvent(event: Stripe.Event): BillingWebhookEvent | null {
  if (event.type !== PAYMENT_METHOD_ATTACHED && event.type !== PAYMENT_METHOD_DETACHED) {
    return null;
  }

  const methodObject = event.data.object;
  if (!isPaymentMethodObject(methodObject)) {
    return null;
  }

  const customerId = resolvePaymentMethodCustomerId(methodObject, event.data.previous_attributes);
  if (!customerId) {
    return null;
  }

  if (event.type === PAYMENT_METHOD_ATTACHED) {
    return {
      type: 'payment_method.attached',
      paymentMethod: toPaymentMethodSummary(methodObject),
      stripeCustomerId: customerId,
    };
  }

  return {
    type: 'payment_method.detached',
    paymentMethodId: methodObject.id,
    stripeCustomerId: customerId,
  };
}

function handleSetupIntentEvent(event: Stripe.Event): BillingWebhookEvent | null {
  if (event.type !== 'setup_intent.succeeded') {
    return null;
  }

  const intentObject = event.data.object;
  if (!isSetupIntentObject(intentObject)) {
    return null;
  }

  const customerId = resolveStripeId(intentObject.customer);
  const paymentMethodId = resolveStripeId(intentObject.payment_method);

  if (customerId && paymentMethodId) {
    return { type: 'setup_intent.succeeded', stripeCustomerId: customerId, paymentMethodId };
  }

  return null;
}

function resolvePaymentMethodCustomerId(
  method: Stripe.PaymentMethod,
  previousAttributes?: Stripe.Event.Data.PreviousAttributes,
): string | null {
  const current = resolveStripeId(method.customer);
  if (current) {
    return current;
  }

  const previousCustomer = (previousAttributes as PaymentMethodPreviousAttributes | undefined)?.customer;
  return typeof previousCustomer === 'string' ? previousCustomer : null;
}

type ResolvableStripeId =
  | string
  | Stripe.Customer
  | Stripe.DeletedCustomer
  | Stripe.PaymentMethod
  | null
  | undefined;

function resolveStripeId(value: ResolvableStripeId): string | null {
  if (!value) {
    return null;
  }
  return typeof value === 'string' ? value : value.id;
}

function hasObjectType(value: unknown, objectType: string): value is { object: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (value as { object?: string }).object === objectType;
}

function isCheckoutSessionObject(value: unknown): value is Stripe.Checkout.Session {
  return hasObjectType(value, 'checkout.session');
}

function isSubscriptionObject(value: unknown): value is Stripe.Subscription {
  return hasObjectType(value, 'subscription');
}

function isInvoiceObject(value: unknown): value is Stripe.Invoice {
  return hasObjectType(value, 'invoice');
}

function isPaymentMethodObject(value: unknown): value is Stripe.PaymentMethod {
  return hasObjectType(value, 'payment_method');
}

function isSetupIntentObject(value: unknown): value is Stripe.SetupIntent {
  return hasObjectType(value, 'setup_intent');
}
