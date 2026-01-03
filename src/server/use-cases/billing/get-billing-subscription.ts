import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrganizationSubscriptionData } from '@/server/types/billing-types';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: fetch billing subscription for an organization.

export interface GetBillingSubscriptionInput {
  authorization: RepositoryAuthorizationContext;
}

export interface GetBillingSubscriptionResult {
  subscription: OrganizationSubscriptionData | null;
}

export interface GetBillingSubscriptionDependencies {
  service?: BillingServiceContract;
}

export async function getBillingSubscription(
  dependencies: GetBillingSubscriptionDependencies,
  input: GetBillingSubscriptionInput,
): Promise<GetBillingSubscriptionResult> {
  const service = dependencies.service ?? getBillingService();
  const subscription = await service.getSubscription(input);
  return { subscription };
}
