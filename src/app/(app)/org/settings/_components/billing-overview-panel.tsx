import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingSubscriptionForUi, getUpcomingInvoiceForUi } from '../billing-store';

export async function BillingOverviewPanel({
  authorization,
}: {
  authorization: RepositoryAuthorizationContext;
}) {
  const [subscription, upcomingInvoice] = await Promise.all([
    getBillingSubscriptionForUi(authorization),
    getUpcomingInvoiceForUi(authorization),
  ]);

  if (!subscription) {
    return (
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.35)] p-5 text-sm text-[hsl(var(--muted-foreground))]">
        <p className="text-[hsl(var(--foreground))]">No active subscription detected.</p>
        <p className="mt-1 text-xs">
          Start a subscription from the billing portal or complete checkout.
        </p>
      </div>
    );
  }

  const statusTone = resolveStatusTone(subscription.status);
  const periodEnd = subscription.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : '--';
  const estimatedCharge = upcomingInvoice
    ? formatCurrency(upcomingInvoice.amountDue, upcomingInvoice.currency)
    : '--';

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.35)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Subscription status</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Live subscription details for the current billing cycle.
          </p>
        </div>
        <Badge variant={statusTone}>{formatStatus(subscription.status)}</Badge>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Next billing</p>
          <p className="mt-1 text-base font-semibold text-[hsl(var(--foreground))]">{periodEnd}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Active users</p>
          <p className="mt-1 text-base font-semibold text-[hsl(var(--foreground))]">
            {subscription.seatCount}
          </p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Est. charge</p>
          <p className="mt-1 text-base font-semibold text-[hsl(var(--foreground))]">
            {estimatedCharge}
          </p>
        </div>
      </div>
      {subscription.status === 'PAST_DUE' ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          Payment failed. Update your payment method to avoid service interruption.
        </div>
      ) : null}
    </div>
  );
}

function formatStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, ' ');
}

function resolveStatusTone(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'PAST_DUE' || status === 'UNPAID') {
    return 'destructive';
  }
  if (status === 'ACTIVE' || status === 'TRIALING') {
    return 'default';
  }
  if (status === 'CANCELED') {
    return 'outline';
  }
  return 'secondary';
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
