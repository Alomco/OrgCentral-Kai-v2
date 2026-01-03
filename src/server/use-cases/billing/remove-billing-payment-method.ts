import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: remove a billing payment method for the org.

export interface RemoveBillingPaymentMethodInput {
  authorization: RepositoryAuthorizationContext;
  paymentMethodId: string;
}

export interface RemoveBillingPaymentMethodDependencies {
  service?: BillingServiceContract;
}

export async function removeBillingPaymentMethod(
  dependencies: RemoveBillingPaymentMethodDependencies,
  input: RemoveBillingPaymentMethodInput,
): Promise<void> {
  const service = dependencies.service ?? getBillingService();
  await service.removePaymentMethod(input);
}
