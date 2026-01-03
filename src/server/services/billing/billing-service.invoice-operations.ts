import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingInvoiceListFilters } from '@/server/repositories/contracts/org/billing';
import type { BillingInvoiceData } from '@/server/types/billing-types';
import type { BillingInvoicePreview } from '@/server/services/billing/billing-gateway';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';

export async function listInvoicesOperation(
  deps: BillingServiceDependencies,
  input: {
    authorization: RepositoryAuthorizationContext;
    filters?: BillingInvoiceListFilters;
  },
): Promise<BillingInvoiceData[]> {
  return deps.billingInvoiceRepository.listByOrgId(
    input.authorization,
    input.authorization.orgId,
    input.filters,
  );
}

export async function getInvoiceOperation(
  deps: BillingServiceDependencies,
  input: {
    authorization: RepositoryAuthorizationContext;
    invoiceId: string;
  },
): Promise<BillingInvoiceData | null> {
  return deps.billingInvoiceRepository.getById(
    input.authorization,
    input.invoiceId,
  );
}

export async function previewUpcomingInvoiceOperation(
  deps: BillingServiceDependencies,
  input: { authorization: RepositoryAuthorizationContext },
): Promise<BillingInvoicePreview | null> {
  const subscription = await deps.subscriptionRepository.getByOrgId(
    input.authorization,
    input.authorization.orgId,
  );
  if (!subscription) {
    return null;
  }
  return deps.billingGateway.previewUpcomingInvoice(subscription.stripeCustomerId);
}
