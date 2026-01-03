import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: create a Stripe setup intent for org billing payment methods.

export interface CreateBillingSetupIntentInput {
  authorization: RepositoryAuthorizationContext;
}

export interface CreateBillingSetupIntentResult {
  clientSecret: string;
}

export interface CreateBillingSetupIntentDependencies {
  service?: BillingServiceContract;
}

export async function createBillingSetupIntent(
  dependencies: CreateBillingSetupIntentDependencies,
  input: CreateBillingSetupIntentInput,
): Promise<CreateBillingSetupIntentResult> {
  const service = dependencies.service ?? getBillingService();
  return service.createSetupIntent(input);
}
