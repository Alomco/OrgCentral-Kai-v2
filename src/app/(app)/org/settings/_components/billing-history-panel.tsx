import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingInvoicesForUi } from '../billing-store';
import type { BillingInvoiceData } from '@/server/types/billing-types';

export async function BillingHistoryPanel({
  authorization,
}: {
  authorization: RepositoryAuthorizationContext;
}) {
  const invoices = await getBillingInvoicesForUi(authorization);

  return (
    <div className="rounded-2xl border border-border bg-card/35 p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Billing history</p>
        <p className="text-xs text-muted-foreground">
          Recent invoices for your subscription.
        </p>
      </div>
      <div className="mt-4 space-y-2">
        {invoices.length ? (
          invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No invoices yet. Your first charge will appear here.
          </p>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: BillingInvoiceData }) {
  const statusTone = resolveInvoiceTone(invoice.status);
  const period = `${formatMonth(invoice.periodStart)} - ${String(invoice.userCount)} users`;
  const amount = formatCurrency(invoice.amountDue, invoice.currency);
  const invoiceLink = invoice.invoicePdf ?? invoice.invoiceUrl;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-sm">
      <div>
        <p className="font-semibold text-foreground">{period}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{amount}</span>
        <Badge variant={statusTone}>{formatStatus(invoice.status)}</Badge>
        {invoiceLink ? (
          <a
            href={invoiceLink}
            className="text-xs font-medium text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Invoice
          </a>
        ) : null}
      </div>
    </div>
  );
}

function resolveInvoiceTone(status: BillingInvoiceData['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'PAID') {
    return 'secondary';
  }
  if (status === 'OPEN') {
    return 'default';
  }
  if (status === 'UNCOLLECTIBLE') {
    return 'destructive';
  }
  if (status === 'VOID') {
    return 'outline';
  }
  return 'outline';
}

function formatStatus(status: BillingInvoiceData['status']): string {
  return status.toLowerCase();
}

function formatMonth(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(parsed);
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(parsed);
}

function formatCurrency(amount: number, currency: string): string {
  const normalizedCurrency = currency.toUpperCase();
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: normalizedCurrency,
  }).format(amount / 100);
}
