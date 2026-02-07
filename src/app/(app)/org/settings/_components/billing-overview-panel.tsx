import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingSubscriptionForUi, getUpcomingInvoiceForUi } from '../billing-store';
import { BillingSubscriptionActions } from './billing-subscription-actions.client';

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
      <div className="rounded-2xl border border-border bg-card/35 p-5 text-sm text-muted-foreground">
        <p className="text-foreground">No active subscription detected.</p>
        <p className="mt-1 text-xs">Start a subscription to enable billing features.</p>
        <BillingSubscriptionActions orgId={authorization.orgId} status={null} />
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
    <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Subscription status</p>
          <p className="text-xs text-muted-foreground">
            Live subscription details for the current billing cycle.
          </p>
        </div>
        <Badge variant={statusTone}>{formatStatus(subscription.status)}</Badge>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next billing</p>
          <p className="mt-1 text-base font-semibold text-foreground">{periodEnd}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active users</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {subscription.seatCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Est. charge</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {estimatedCharge}
          </p>
        </div>
      </div>
      {subscription.status === 'PAST_DUE' ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          Payment failed. Update your payment method to avoid service interruption.
        </div>
      ) : null}
      <BillingSubscriptionActions orgId={authorization.orgId} status={subscription.status} />
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
