import { ValidationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOrganizationSubscriptionRepository } from '@/server/repositories/contracts/org/billing';
import type { BillingGateway } from '@/server/services/billing/billing-gateway';
import type { BillingConfig } from '@/server/services/billing/billing-config';
import { resolveBillingPriceId, type BillingCadence } from '@/server/services/billing/billing-preferences';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING', 'PAST_DUE']);

export interface SyncBillingSubscriptionPreferencesDependencies {
  subscriptionRepository: IOrganizationSubscriptionRepository;
  billingGateway: BillingGateway;
  billingConfig: BillingConfig;
}

export interface SyncBillingSubscriptionPreferencesInput {
  authorization: RepositoryAuthorizationContext;
  billingCadence: BillingCadence;
  autoRenew: boolean;
}

export async function syncBillingSubscriptionPreferences(
  deps: SyncBillingSubscriptionPreferencesDependencies,
  input: SyncBillingSubscriptionPreferencesInput,
): Promise<void> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return;
  }

  const nextPriceId = resolveBillingPriceId(input.billingCadence, deps.billingConfig);
  const nextCancelAtPeriodEnd = !input.autoRenew;

  const priceChanged = subscription.stripePriceId !== nextPriceId;
  const renewalChanged = subscription.cancelAtPeriodEnd !== nextCancelAtPeriodEnd;
  if (!priceChanged && !renewalChanged) {
    return;
  }

  if (priceChanged && !subscription.stripeSubscriptionItemId) {
    throw new ValidationError('Subscription item is missing for pricing updates.');
  }

  await deps.billingGateway.updateSubscription({
    subscriptionId: subscription.stripeSubscriptionId,
    subscriptionItemId: priceChanged ? subscription.stripeSubscriptionItemId ?? undefined : undefined,
    priceId: priceChanged ? nextPriceId : undefined,
    cancelAtPeriodEnd: renewalChanged ? nextCancelAtPeriodEnd : undefined,
    prorationBehavior: priceChanged ? 'create_prorations' : undefined,
  });
}
