import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: create a Stripe billing portal session for org admins.

export interface CreateBillingPortalSessionInput {
  authorization: RepositoryAuthorizationContext;
}

export interface CreateBillingPortalSessionResult {
  url: string;
}

export interface CreateBillingPortalSessionDependencies {
  service?: BillingServiceContract;
}

export async function createBillingPortalSession(
  dependencies: CreateBillingPortalSessionDependencies,
  input: CreateBillingPortalSessionInput,
): Promise<CreateBillingPortalSessionResult> {
  const service = dependencies.service ?? getBillingService();
  return service.createPortalSession(input);
}
