import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: set a default billing payment method for the org.

export interface SetDefaultBillingPaymentMethodInput {
  authorization: RepositoryAuthorizationContext;
  paymentMethodId: string;
}

export interface SetDefaultBillingPaymentMethodDependencies {
  service?: BillingServiceContract;
}

export async function setDefaultBillingPaymentMethod(
  dependencies: SetDefaultBillingPaymentMethodDependencies,
  input: SetDefaultBillingPaymentMethodInput,
): Promise<void> {
  const service = dependencies.service ?? getBillingService();
  await service.setDefaultPaymentMethod(input);
}
