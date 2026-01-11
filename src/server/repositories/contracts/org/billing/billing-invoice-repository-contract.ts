import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BillingInvoiceData, BillingInvoiceStatus } from '@/server/types/billing-types';

export interface BillingInvoiceUpsertInput {
  orgId: string;
  stripeInvoiceId: string;
  status: BillingInvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  userCount: number;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
  paidAt?: Date | null;
  metadata?: Record<string, string> | null;
}

export interface BillingInvoiceListFilters {
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface IBillingInvoiceRepository {
  listByOrgId(
    context: RepositoryAuthorizationContext,
    orgId: string,
    filters?: BillingInvoiceListFilters,
  ): Promise<BillingInvoiceData[]>;

  getByStripeId(
    context: RepositoryAuthorizationContext,
    stripeInvoiceId: string,
  ): Promise<BillingInvoiceData | null>;

  getById(
    context: RepositoryAuthorizationContext,
    invoiceId: string,
  ): Promise<BillingInvoiceData | null>;

  upsertInvoice(
    context: RepositoryAuthorizationContext,
    input: BillingInvoiceUpsertInput,
  ): Promise<BillingInvoiceData>;
}
