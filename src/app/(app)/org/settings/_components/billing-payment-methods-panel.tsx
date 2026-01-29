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
    <div className="rounded-2xl border border-border bg-card/35 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Payment methods</p>
          <p className="text-xs text-muted-foreground">
            Manage cards or direct debit mandates for this subscription.
          </p>
        </div>
      </div>
      <BillingPaymentMethodsClient orgId={authorization.orgId} paymentMethods={paymentMethods}
        canManage={Boolean(subscription)}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
      />
    </div>
  );
}

