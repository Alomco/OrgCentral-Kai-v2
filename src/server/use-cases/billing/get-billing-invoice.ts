import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingInvoiceData } from '@/server/types/billing-types';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: fetch a single billing invoice by id.

export interface GetBillingInvoiceInput {
  authorization: RepositoryAuthorizationContext;
  invoiceId: string;
}

export interface GetBillingInvoiceResult {
  invoice: BillingInvoiceData | null;
}

export interface GetBillingInvoiceDependencies {
  service?: BillingServiceContract;
}

export async function getBillingInvoice(
  dependencies: GetBillingInvoiceDependencies,
  input: GetBillingInvoiceInput,
): Promise<GetBillingInvoiceResult> {
  const service = dependencies.service ?? getBillingService();
  const invoice = await service.getInvoice(input);
  return { invoice };
}
