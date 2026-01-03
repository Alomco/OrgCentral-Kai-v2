import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingInvoicePreview } from '@/server/services/billing/billing-gateway';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: preview the upcoming billing invoice for an org.

export interface GetUpcomingBillingInvoiceInput {
  authorization: RepositoryAuthorizationContext;
}

export interface GetUpcomingBillingInvoiceResult {
  upcomingInvoice: BillingInvoicePreview | null;
}

export interface GetUpcomingBillingInvoiceDependencies {
  service?: BillingServiceContract;
}

export async function getUpcomingBillingInvoice(
  dependencies: GetUpcomingBillingInvoiceDependencies,
  input: GetUpcomingBillingInvoiceInput,
): Promise<GetUpcomingBillingInvoiceResult> {
  const service = dependencies.service ?? getBillingService();
  const upcomingInvoice = await service.getUpcomingInvoice(input);
  return { upcomingInvoice };
}
