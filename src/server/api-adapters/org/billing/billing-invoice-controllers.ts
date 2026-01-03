import { z } from 'zod';

import { ValidationError } from '@/server/errors';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { listBillingInvoices } from '@/server/use-cases/billing/list-billing-invoices';
import { getBillingInvoice } from '@/server/use-cases/billing/get-billing-invoice';
import { getUpcomingBillingInvoice } from '@/server/use-cases/billing/get-upcoming-billing-invoice';
import type { BillingInvoiceData } from '@/server/types/billing-types';

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';
const INVOICE_ID_REQUIRED_MESSAGE = 'Invoice id is required.';
const BILLING_RESOURCE_TYPE = 'org.billing';
const invoiceListSchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict();

export interface BillingInvoicesResult {
  success: true;
  invoices: BillingInvoiceData[];
}

export interface BillingInvoiceResult {
  success: true;
  invoice: BillingInvoiceData | null;
}

export interface BillingUpcomingInvoiceResult {
  success: true;
  upcomingInvoice: {
    amountDue: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    userCount: number;
  } | null;
}

export async function listBillingInvoicesController(
  request: Request,
  orgId: string,
): Promise<BillingInvoicesResult> {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const url = new URL(request.url);
  const parsedFilters = invoiceListSchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsedFilters.success) {
    throw new ValidationError('Invalid invoice filters.');
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['read'] },
      auditSource: 'api:org:billing:invoices:list',
      action: 'org.billing.invoice.list',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId },
    },
  );

  const filters = {
    from: parsedFilters.data.from ? new Date(parsedFilters.data.from) : undefined,
    to: parsedFilters.data.to ? new Date(parsedFilters.data.to) : undefined,
    limit: parsedFilters.data.limit,
  };

  const result = await listBillingInvoices({}, { authorization, filters });

  return { success: true, invoices: result.invoices };
}

export async function getBillingInvoiceController(
  request: Request,
  orgId: string,
  invoiceId: string,
): Promise<BillingInvoiceResult> {
  const normalizedOrgId = orgId.trim();
  const normalizedInvoiceId = invoiceId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedInvoiceId) {
    throw new ValidationError(INVOICE_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['read'] },
      auditSource: 'api:org:billing:invoice:read',
      action: 'org.billing.invoice.read',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId, invoiceId: normalizedInvoiceId },
    },
  );

  const result = await getBillingInvoice({}, { authorization, invoiceId: normalizedInvoiceId });

  return { success: true, invoice: result.invoice };
}

export async function getUpcomingBillingInvoiceController(
  request: Request,
  orgId: string,
): Promise<BillingUpcomingInvoiceResult> {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['read'] },
      auditSource: 'api:org:billing:invoice:upcoming',
      action: 'org.billing.invoice.preview',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId },
    },
  );

  const result = await getUpcomingBillingInvoice({}, { authorization });
  const upcomingInvoice = result.upcomingInvoice
    ? {
      amountDue: result.upcomingInvoice.amountDue,
      currency: result.upcomingInvoice.currency,
      periodStart: result.upcomingInvoice.periodStart.toISOString(),
      periodEnd: result.upcomingInvoice.periodEnd.toISOString(),
      userCount: result.upcomingInvoice.userCount,
    }
    : null;

  return { success: true, upcomingInvoice };
}
