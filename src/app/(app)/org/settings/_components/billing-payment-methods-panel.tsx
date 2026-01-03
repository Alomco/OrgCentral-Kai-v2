import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingPaymentMethodsForUi, getBillingSubscriptionForUi } from '../billing-store';
import { BillingPaymentMethodsClient } from './billing-payment-methods.client';

export async function BillingPaymentMethodsPanel({
  authorization,
}: {
  authorization: RepositoryAuthorizationContext;
}) {
  const [subscription, paymentMethods] = await Promise.all([
    getBillingSubscriptionForUi(authorization),
    getBillingPaymentMethodsForUi(authorization),
  ]);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.35)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Payment methods</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Manage cards or direct debit mandates for this subscription.
          </p>
        </div>
      </div>
      <BillingPaymentMethodsClient
        paymentMethods={paymentMethods}
        canManage={Boolean(subscription)}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
      />
    </div>
  );
}
