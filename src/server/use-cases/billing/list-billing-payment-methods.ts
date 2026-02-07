import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PaymentMethodData } from '@/server/types/billing-types';
import { resolveBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: list payment methods for org billing via billing service.

export interface ListBillingPaymentMethodsInput {
  authorization: RepositoryAuthorizationContext;
}

export interface ListBillingPaymentMethodsResult {
  paymentMethods: PaymentMethodData[];
  billingConfigured: boolean;
}

export interface ListBillingPaymentMethodsDependencies {
  service?: BillingServiceContract;
}

export async function listBillingPaymentMethods(
  dependencies: ListBillingPaymentMethodsDependencies,
  input: ListBillingPaymentMethodsInput,
): Promise<ListBillingPaymentMethodsResult> {
  const service = dependencies.service ?? resolveBillingService();
  if (!service) {
    return {
      paymentMethods: [],
      billingConfigured: false,
    };
  }
  const paymentMethods = await service.listPaymentMethods(input);
  return {
    paymentMethods,
    billingConfigured: true,
  };
}
