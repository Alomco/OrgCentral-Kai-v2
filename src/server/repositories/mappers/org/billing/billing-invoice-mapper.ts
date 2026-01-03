import type { BillingInvoice } from '@prisma/client';

import type { BillingInvoiceData } from '@/server/types/billing-types';

export function mapBillingInvoiceToData(invoice: BillingInvoice): BillingInvoiceData {
  return {
    id: invoice.id,
    orgId: invoice.orgId,
    stripeInvoiceId: invoice.stripeInvoiceId,
    status: invoice.status,
    amountDue: invoice.amountDue,
    amountPaid: invoice.amountPaid,
    currency: invoice.currency,
    periodStart: invoice.periodStart.toISOString(),
    periodEnd: invoice.periodEnd.toISOString(),
    userCount: invoice.userCount,
    invoiceUrl: invoice.invoiceUrl ?? null,
    invoicePdf: invoice.invoicePdf ?? null,
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    dataClassification: invoice.dataClassification,
    dataResidency: invoice.residencyTag,
    auditSource: 'billing-repository',
    auditBatchId: undefined,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}
