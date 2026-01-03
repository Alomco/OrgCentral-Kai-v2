import { ValidationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PaymentMethodData } from '@/server/types/billing-types';
import type { BillingPaymentMethodType } from '@/server/services/billing/billing-gateway';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';

export async function createSetupIntentOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext },
): Promise<{ clientSecret: string }> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    throw new ValidationError('Subscription is required to add payment methods.');
  }

  const result = await deps.billingGateway.createSetupIntent({
    customerId: subscription.stripeCustomerId,
    paymentMethodTypes: resolveSetupIntentTypes(deps),
  });

  return { clientSecret: result.clientSecret };
}

export async function listPaymentMethodsOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext },
): Promise<PaymentMethodData[]> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    return [];
  }

  return syncPaymentMethodsFromStripe(
    deps,
    input.authorization,
    subscription.stripeCustomerId,
  );
}

export async function setDefaultPaymentMethodOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext; paymentMethodId: string },
): Promise<void> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    throw new ValidationError('Subscription is required to update payment methods.');
  }

  await deps.billingGateway.setDefaultPaymentMethod({
    customerId: subscription.stripeCustomerId,
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
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    throw new ValidationError('Subscription is required to update payment methods.');
  }

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
