import { ValidationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';
import {
  buildSeatSyncIdempotencyKey,
  resolveBillingPreferences,
} from '@/server/services/billing/billing-preferences';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';

export async function createCheckoutSessionOperation(
  deps: BillingServiceDependencies,
  orgSettingsLoader: (orgId: string) => Promise<OrgSettings>,
  input: {
    authorization: RepositoryAuthorizationContext;
    customerEmail?: string | null;
  },
): Promise<{ url: string }> {
  const orgSettings = await orgSettingsLoader(input.authorization.orgId);
  const billingPreferences = resolveBillingPreferences(orgSettings, deps.billingConfig);
  const existing = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (existing?.status === 'ACTIVE' || existing?.status === 'TRIALING') {
    throw new ValidationError('Subscription is already active.');
  }

  const seatCount = await resolveSeatCount(deps, input.authorization);
  const result = await deps.billingGateway.createCheckoutSession({
    orgId: input.authorization.orgId,
    userId: input.authorization.userId,
    customerEmail: input.customerEmail ?? billingPreferences.customerEmail,
    seatCount,
    successUrl: deps.billingConfig.stripeSuccessUrl,
    cancelUrl: deps.billingConfig.stripeCancelUrl,
    priceId: billingPreferences.priceId,
  });

  return { url: result.url };
}

export async function createPortalSessionOperation(
  deps: BillingServiceDependencies,
  input: {
    authorization: RepositoryAuthorizationContext;
  },
): Promise<{ url: string }> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    throw new ValidationError('Subscription not found for this organization.');
  }

  const result = await deps.billingGateway.createPortalSession({
    customerId: subscription.stripeCustomerId,
    returnUrl: deps.billingConfig.stripePortalReturnUrl ?? deps.billingConfig.stripeSuccessUrl,
  });

  return { url: result.url };
}

export async function syncSeatsOperation(
  deps: BillingServiceDependencies,
  orgSettingsLoader: (orgId: string) => Promise<OrgSettings>,
  input: {
    authorization: RepositoryAuthorizationContext;
  },
): Promise<void> {
  const orgSettings = await orgSettingsLoader(input.authorization.orgId);
  if (!orgSettings.billing.autoRenew) {
    return;
  }
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (
    !subscription?.stripeSubscriptionItemId ||
    !['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(subscription.status)
  ) {
    return;
  }

  const seatCount = await resolveSeatCount(deps, input.authorization);
  if (seatCount === subscription.seatCount) {
    return;
  }

  await deps.billingGateway.updateSubscriptionSeats({
    subscriptionItemId: subscription.stripeSubscriptionItemId,
    seatCount,
    idempotencyKey: buildSeatSyncIdempotencyKey(
      subscription.stripeSubscriptionItemId,
      seatCount,
    ),
  });

  await deps.subscriptionRepository.updateSeatCount(
    input.authorization,
    input.authorization.orgId,
    seatCount,
  );
}

async function resolveSeatCount(
  deps: BillingServiceDependencies,
  authorization: RepositoryAuthorizationContext,
): Promise<number> {
  const count = await deps.membershipRepository.countActiveMemberships(authorization);
  return Math.max(count, 1);
}
