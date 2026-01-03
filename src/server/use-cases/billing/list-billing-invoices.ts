import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingInvoiceData } from '@/server/types/billing-types';
import type { BillingInvoiceListFilters } from '@/server/repositories/contracts/org/billing';
import { getBillingService, type BillingServiceContract } from '@/server/services/billing/billing-service.provider';

// Use-case: list billing invoices for an org via billing services.

export interface ListBillingInvoicesInput {
  authorization: RepositoryAuthorizationContext;
  filters?: BillingInvoiceListFilters;
}

export interface ListBillingInvoicesResult {
  invoices: BillingInvoiceData[];
}

export interface ListBillingInvoicesDependencies {
  service?: BillingServiceContract;
}

export async function listBillingInvoices(
  dependencies: ListBillingInvoicesDependencies,
  input: ListBillingInvoicesInput,
): Promise<ListBillingInvoicesResult> {
  const service = dependencies.service ?? getBillingService();
  const invoices = await service.listInvoices(input);
  return { invoices };
}
