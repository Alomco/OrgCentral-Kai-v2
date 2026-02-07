import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getBillingPaymentMethodsForUi } from '../billing-store';
import { BillingPaymentMethodsClient } from './billing-payment-methods.client';

export async function BillingPaymentMethodsPanel({
  authorization,
}: {
  authorization: RepositoryAuthorizationContext;
}) {
  const paymentMethodsView = await getBillingPaymentMethodsForUi(authorization);

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Payment methods</p>
          <p className="text-xs text-muted-foreground">
            Manage cards or direct debit mandates for this organization.
          </p>
        </div>
      </div>
      <BillingPaymentMethodsClient
        orgId={authorization.orgId}
        paymentMethods={paymentMethodsView.paymentMethods}
        billingConfigured={paymentMethodsView.billingConfigured}
        canManage={true}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
      />
    </div>
  );
}
