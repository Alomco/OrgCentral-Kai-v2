import { appLogger } from '@/server/logging/structured-logger';
import type { OrganizationSubscriptionData } from '@/server/types/billing-types';
import type { BillingWebhookEvent, BillingInvoiceSnapshot } from '@/server/services/billing/billing-gateway';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';
import { buildSystemAuthorizationContext } from '@/server/services/billing/billing-service.helpers';
import { syncPaymentMethodsFromStripe } from '@/server/services/billing/billing-service.payment-method-operations';

const WEBHOOK_AUDIT_SOURCE = 'stripe:webhook';
const MISSING_ORG_ID_MESSAGE = 'billing.webhook.missing-org-id';

export async function handleBillingWebhookEvent(
  deps: BillingServiceDependencies,
  event: BillingWebhookEvent,
): Promise<{ received: true }> {
  switch (event.type) {
    case 'checkout.completed':
    case 'ignored':
      return { received: true };

    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.deleted': {
      const subscription = event.subscription;
      const orgId = subscription.orgId ?? null;
      if (!orgId) {
        appLogger.warn(MISSING_ORG_ID_MESSAGE, {
          eventType: event.type,
          subscriptionId: subscription.stripeSubscriptionId,
        });
        return { received: true };
      }

      const authorization = await buildSystemAuthorizationContext({
        organizationRepository: deps.organizationRepository,
        orgId,
        userId: subscription.userId,
        auditSource: WEBHOOK_AUDIT_SOURCE,
      });

      await deps.subscriptionRepository.upsertSubscription(authorization, {
        orgId,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeSubscriptionItemId: subscription.stripeSubscriptionItemId ?? null,
        stripePriceId: subscription.stripePriceId,
        status: subscription.status,
        seatCount: subscription.seatCount,
        currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeEventCreatedAt: event.stripeEventCreatedAt,
        metadata: subscription.metadata ?? null,
      });

      return { received: true };
    }

    case 'invoice.created':
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const orgId = await resolveOrgIdForInvoice(deps, event.invoice);
      if (!orgId) {
        appLogger.warn(MISSING_ORG_ID_MESSAGE, {
          eventType: event.type,
          invoiceId: event.invoice.stripeInvoiceId,
        });
        return { received: true };
      }

      const authorization = await buildSystemAuthorizationContext({
        organizationRepository: deps.organizationRepository,
        orgId,
        userId: resolveInvoiceUserId(event.invoice),
        auditSource: WEBHOOK_AUDIT_SOURCE,
      });

      await deps.billingInvoiceRepository.upsertInvoice(authorization, {
        orgId,
        stripeInvoiceId: event.invoice.stripeInvoiceId,
        status: event.invoice.status,
        amountDue: event.invoice.amountDue,
        amountPaid: event.invoice.amountPaid,
        currency: event.invoice.currency,
        periodStart: event.invoice.periodStart,
        periodEnd: event.invoice.periodEnd,
        userCount: event.invoice.userCount,
        invoiceUrl: event.invoice.invoiceUrl ?? null,
        invoicePdf: event.invoice.invoicePdf ?? null,
        paidAt: event.invoice.paidAt ?? null,
        metadata: event.invoice.metadata ?? null,
      });

      if (event.type === 'invoice.payment_failed') {
        appLogger.warn('billing.invoice.payment_failed', {
          orgId,
          invoiceId: event.invoice.stripeInvoiceId,
          failureReason: event.failureReason ?? null,
        });
      }

      return { received: true };
    }

    case 'invoice.upcoming':
      return { received: true };

    case 'payment_method.attached':
    case 'payment_method.detached': {
      const subscription = await resolveSubscriptionByCustomerId(deps, event.stripeCustomerId);
      if (!subscription) {
        appLogger.warn(MISSING_ORG_ID_MESSAGE, {
          eventType: event.type,
          customerId: event.stripeCustomerId,
        });
        return { received: true };
      }

      const authorization = await buildSystemAuthorizationContext({
        organizationRepository: deps.organizationRepository,
        orgId: subscription.orgId,
        auditSource: WEBHOOK_AUDIT_SOURCE,
      });

      if (event.type === 'payment_method.detached') {
        await deps.paymentMethodRepository.removePaymentMethod(
          authorization,
          subscription.orgId,
          event.paymentMethodId,
        );
      }

      await syncPaymentMethodsFromStripe(deps, authorization, event.stripeCustomerId);
      return { received: true };
    }

    case 'setup_intent.succeeded': {
      const subscription = await resolveSubscriptionByCustomerId(deps, event.stripeCustomerId);
      if (!subscription) {
        appLogger.warn(MISSING_ORG_ID_MESSAGE, {
          eventType: event.type,
          customerId: event.stripeCustomerId,
        });
        return { received: true };
      }

      const authorization = await buildSystemAuthorizationContext({
        organizationRepository: deps.organizationRepository,
        orgId: subscription.orgId,
        auditSource: WEBHOOK_AUDIT_SOURCE,
      });

      await syncPaymentMethodsFromStripe(deps, authorization, event.stripeCustomerId);
      return { received: true };
    }

    default:
      return { received: true };
  }
}

async function resolveOrgIdForInvoice(
  deps: BillingServiceDependencies,
  invoice: BillingInvoiceSnapshot,
): Promise<string | null> {
  if (invoice.orgId) {
    return invoice.orgId;
  }

  if (invoice.stripeSubscriptionId) {
    const subscription = await deps.subscriptionRepository.getByStripeSubscriptionId(
      invoice.stripeSubscriptionId,
    );
    if (subscription) {
      return subscription.orgId;
    }
  }

  if (invoice.stripeCustomerId) {
    const subscription = await deps.subscriptionRepository.getByStripeCustomerId(
      invoice.stripeCustomerId,
    );
    if (subscription) {
      return subscription.orgId;
    }
  }

  return null;
}

function resolveInvoiceUserId(invoice: BillingInvoiceSnapshot): string | null {
  if (invoice.metadata && Object.prototype.hasOwnProperty.call(invoice.metadata, 'userId')) {
    return invoice.metadata.userId;
  }
  return null;
}

async function resolveSubscriptionByCustomerId(
  deps: BillingServiceDependencies,
  customerId: string,
): Promise<OrganizationSubscriptionData | null> {
  if (!customerId) {
    return null;
  }
  return deps.subscriptionRepository.getByStripeCustomerId(customerId);
}
