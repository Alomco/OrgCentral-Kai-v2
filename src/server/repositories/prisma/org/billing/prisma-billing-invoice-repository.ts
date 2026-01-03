import { Prisma } from '@prisma/client';

import type {
  IBillingInvoiceRepository,
  BillingInvoiceListFilters,
  BillingInvoiceUpsertInput,
} from '@/server/repositories/contracts/org/billing';
import type { BillingInvoiceData } from '@/server/types/billing-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import { getModelDelegate, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapBillingInvoiceToData } from '@/server/repositories/mappers/org/billing/billing-invoice-mapper';
import { CACHE_SCOPE_BILLING_INVOICES } from '@/server/repositories/cache-scopes';

export class PrismaBillingInvoiceRepository
  extends OrgScopedPrismaRepository
  implements IBillingInvoiceRepository {
  async listByOrgId(
    context: RepositoryAuthorizationContext,
    orgId: string,
    filters?: BillingInvoiceListFilters,
  ): Promise<BillingInvoiceData[]> {
    if (orgId !== context.orgId) {
      throw new Error('Cross-tenant billing invoice list rejected.');
    }
    this.tagCache(context, CACHE_SCOPE_BILLING_INVOICES);

    const where: Prisma.BillingInvoiceWhereInput = { orgId };
    if (filters?.from || filters?.to) {
      where.periodStart = {};
      if (filters.from) {
        where.periodStart.gte = filters.from;
      }
      if (filters.to) {
        where.periodStart.lte = filters.to;
      }
    }

    const records = await getModelDelegate(this.prisma, 'billingInvoice').findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: filters?.limit,
    });
    return records.map(mapBillingInvoiceToData);
  }

  async getByStripeId(
    context: RepositoryAuthorizationContext,
    stripeInvoiceId: string,
  ): Promise<BillingInvoiceData | null> {
    this.tagCache(context, CACHE_SCOPE_BILLING_INVOICES);
    const record = await getModelDelegate(this.prisma, 'billingInvoice').findUnique({
      where: { stripeInvoiceId },
    });
    if (!record) {
      return null;
    }
    this.assertTenantRecord(record, context.orgId);
    return mapBillingInvoiceToData(record);
  }

  async getById(
    context: RepositoryAuthorizationContext,
    invoiceId: string,
  ): Promise<BillingInvoiceData | null> {
    this.tagCache(context, CACHE_SCOPE_BILLING_INVOICES);
    const record = await getModelDelegate(this.prisma, 'billingInvoice').findUnique({
      where: { id: invoiceId },
    });
    if (!record) {
      return null;
    }
    this.assertTenantRecord(record, context.orgId);
    return mapBillingInvoiceToData(record);
  }

  async upsertInvoice(
    context: RepositoryAuthorizationContext,
    input: BillingInvoiceUpsertInput,
  ): Promise<BillingInvoiceData> {
    if (input.orgId !== context.orgId) {
      throw new Error('Cross-tenant billing invoice update rejected.');
    }

    const metadata =
      input.metadata && Object.keys(input.metadata).length > 0
        ? toPrismaInputJson(input.metadata)
        : Prisma.JsonNull;

    const record = await getModelDelegate(this.prisma, 'billingInvoice').upsert({
      where: { stripeInvoiceId: input.stripeInvoiceId },
      create: {
        orgId: input.orgId,
        stripeInvoiceId: input.stripeInvoiceId,
        status: input.status,
        amountDue: input.amountDue,
        amountPaid: input.amountPaid,
        currency: input.currency,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        userCount: input.userCount,
        invoiceUrl: input.invoiceUrl ?? null,
        invoicePdf: input.invoicePdf ?? null,
        paidAt: input.paidAt ?? null,
        metadata,
        dataClassification: context.dataClassification,
        residencyTag: context.dataResidency,
      },
      update: {
        status: input.status,
        amountDue: input.amountDue,
        amountPaid: input.amountPaid,
        currency: input.currency,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        userCount: input.userCount,
        invoiceUrl: input.invoiceUrl ?? null,
        invoicePdf: input.invoicePdf ?? null,
        paidAt: input.paidAt ?? null,
        metadata,
        dataClassification: context.dataClassification,
        residencyTag: context.dataResidency,
      },
    });

    await this.invalidateCache(context, CACHE_SCOPE_BILLING_INVOICES);
    return mapBillingInvoiceToData(record);
  }
}
