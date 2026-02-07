import { ValidationError } from '@/server/errors';
import { appLogger } from '@/server/logging/structured-logger';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PaymentMethodData } from '@/server/types/billing-types';
import type { BillingPaymentMethodType } from '@/server/services/billing/billing-gateway';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';
import { normalizeOrgSettings } from '@/server/services/org/settings/org-settings-model';
import { updateOrgSettings } from '@/server/services/org/settings/org-settings-store';
import { resolveBillingCustomerId } from '@/server/services/billing/billing-customer-profile';
import type { PrismaJsonValue } from '@/server/types/prisma';

const PAYMENT_METHOD_NOT_FOUND_MESSAGE = 'Payment method not found for this organization.';
const PAYMENT_METHOD_OWNERSHIP_MISMATCH_MESSAGE = 'Payment method does not belong to this organization.';

export async function createSetupIntentOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext },
): Promise<{ clientSecret: string }> {
  const customerId = await resolveStripeCustomerIdForOrg(deps, input.authorization, {
    createIfMissing: true,
  });
  if (!customerId) {
    throw new ValidationError('Unable to resolve Stripe customer for this organization.');
  }

  const result = await deps.billingGateway.createSetupIntent({
    customerId,
    paymentMethodTypes: resolveSetupIntentTypes(deps),
  });

  return { clientSecret: result.clientSecret };
}

export async function listPaymentMethodsOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext },
): Promise<PaymentMethodData[]> {
  const customerId = await resolveStripeCustomerIdForOrg(deps, input.authorization, {
    createIfMissing: false,
  });
  if (!customerId) {
    return [];
  }

  return syncPaymentMethodsFromStripe(deps, input.authorization, customerId);
}

export async function setDefaultPaymentMethodOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext; paymentMethodId: string },
): Promise<void> {
  const customerId = await resolveStripeCustomerIdForOrg(deps, input.authorization, {
    createIfMissing: false,
  });
  if (!customerId) {
    throw new ValidationError('Billing customer is not configured for this organization.');
  }

  await assertPaymentMethodOwnership(deps, input.authorization, customerId, input.paymentMethodId);

  await deps.billingGateway.setDefaultPaymentMethod({
    customerId,
    paymentMethodId: input.paymentMethodId,
  });

  await deps.paymentMethodRepository.setDefaultPaymentMethod(
    input.authorization,
    input.authorization.orgId,
    input.paymentMethodId,
  );
}

export async function removePaymentMethodOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext; paymentMethodId: string },
): Promise<void> {
  const customerId = await resolveStripeCustomerIdForOrg(deps, input.authorization, {
    createIfMissing: false,
  });
  if (!customerId) {
    throw new ValidationError('Billing customer is not configured for this organization.');
  }

  await assertPaymentMethodOwnership(deps, input.authorization, customerId, input.paymentMethodId);

  await deps.billingGateway.detachPaymentMethod(input.paymentMethodId);
  await deps.paymentMethodRepository.removePaymentMethod(
    input.authorization,
    input.authorization.orgId,
    input.paymentMethodId,
  );
}

export async function syncPaymentMethodsFromStripe(
  deps: BillingServiceDependencies,
  authorization: RepositoryAuthorizationContext,
  stripeCustomerId: string,
): Promise<PaymentMethodData[]> {
  const methods = await deps.billingGateway.listPaymentMethods(stripeCustomerId);
  const updates = await Promise.all(
    methods.map((method) =>
      deps.paymentMethodRepository.upsertPaymentMethod(authorization, {
        orgId: authorization.orgId,
        stripePaymentMethodId: method.stripePaymentMethodId,
        type: method.type,
        last4: method.last4,
        brand: method.brand ?? null,
        bankName: method.bankName ?? null,
        expiryMonth: method.expiryMonth ?? null,
        expiryYear: method.expiryYear ?? null,
        isDefault: method.isDefault,
      }),
    ),
  );

  return updates.sort((a, b) => {
    if (a.isDefault && !b.isDefault) {
      return -1;
    }
    if (!a.isDefault && b.isDefault) {
      return 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function resolveSetupIntentTypes(deps: BillingServiceDependencies): BillingPaymentMethodType[] {
  const types: BillingPaymentMethodType[] = ['card'];
  if (deps.billingConfig.stripeEnableBacsDebit) {
    types.push('bacs_debit');
  }
  if (deps.billingConfig.stripeEnableSepaDebit) {
    types.push('sepa_debit');
  }
  return types;
}

async function resolveStripeCustomerIdForOrg(
  deps: BillingServiceDependencies,
  authorization: RepositoryAuthorizationContext,
  options: { createIfMissing: boolean },
): Promise<string | null> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    authorization,
    authorization.orgId,
  );
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  const settings = await deps.organizationRepository.getOrganizationSettings(authorization.orgId);
  const normalizedSettings = normalizeOrgSettings((settings ?? {}) as PrismaJsonValue);
  const existingCustomerId = resolveBillingCustomerId(normalizedSettings);
  if (existingCustomerId) {
    return existingCustomerId;
  }

  if (!options.createIfMissing) {
    return null;
  }

  const billingEmail = normalizedSettings.billing.billingEmail.trim();
  const created = await deps.billingGateway.createCustomer({
    orgId: authorization.orgId,
    userId: authorization.userId,
    email: billingEmail.length > 0 ? billingEmail : null,
  });

  await updateOrgSettings(authorization, {
    billing: {
      ...normalizedSettings.billing,
      billingCustomerId: created.customerId,
    },
  });

  appLogger.info('billing.customer.provisioned', {
    orgId: authorization.orgId,
    userId: authorization.userId,
    customerId: created.customerId,
  });

  return created.customerId;
}

async function assertPaymentMethodOwnership(
  deps: BillingServiceDependencies,
  authorization: RepositoryAuthorizationContext,
  expectedCustomerId: string,
  paymentMethodId: string,
): Promise<void> {
  await ensureLocalPaymentMethodExists(deps, authorization, expectedCustomerId, paymentMethodId);

  const stripeCustomerId = await deps.billingGateway.getPaymentMethodCustomerId(paymentMethodId);
  if (stripeCustomerId === expectedCustomerId) {
    return;
  }

  appLogger.warn('billing.payment-method.ownership-mismatch', {
    orgId: authorization.orgId,
    userId: authorization.userId,
    paymentMethodId,
    expectedCustomerId,
    actualCustomerId: stripeCustomerId,
  });

  throw new ValidationError(PAYMENT_METHOD_OWNERSHIP_MISMATCH_MESSAGE);
}

async function ensureLocalPaymentMethodExists(
  deps: BillingServiceDependencies,
  authorization: RepositoryAuthorizationContext,
  stripeCustomerId: string,
  paymentMethodId: string,
): Promise<void> {
  const localPaymentMethod = await deps.paymentMethodRepository.getByStripeId(authorization, paymentMethodId);
  if (localPaymentMethod) {
    return;
  }

  appLogger.info('billing.payment-method.missing-local.sync-retry', {
    orgId: authorization.orgId,
    userId: authorization.userId,
    paymentMethodId,
    stripeCustomerId,
  });
  await syncPaymentMethodsFromStripe(deps, authorization, stripeCustomerId);

  const syncedPaymentMethod = await deps.paymentMethodRepository.getByStripeId(authorization, paymentMethodId);
  if (syncedPaymentMethod) {
    return;
  }

  throw new ValidationError(PAYMENT_METHOD_NOT_FOUND_MESSAGE);
}
