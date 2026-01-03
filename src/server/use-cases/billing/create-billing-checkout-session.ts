import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: create a billing checkout session for org subscriptions.

export interface CreateBillingCheckoutSessionInput {
  authorization: RepositoryAuthorizationContext;
  customerEmail?: string | null;
}

export interface CreateBillingCheckoutSessionResult {
  url: string;
}

export interface CreateBillingCheckoutSessionDependencies {
  service?: BillingServiceContract;
}

export async function createBillingCheckoutSession(
  dependencies: CreateBillingCheckoutSessionDependencies,
  input: CreateBillingCheckoutSessionInput,
): Promise<CreateBillingCheckoutSessionResult> {
  const service = dependencies.service ?? getBillingService();
  return service.createCheckoutSession(input);
}
