import type { BillingConfig } from '@/server/services/billing/billing-config';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';

export type BillingCadence = OrgSettings['billing']['billingCadence'];

const SEAT_SYNC_BUCKET_MS = 5 * 60 * 1000;

export function buildSeatSyncIdempotencyKey(subscriptionItemId: string, seatCount: number): string {
  const bucket = Math.floor(Date.now() / SEAT_SYNC_BUCKET_MS);
  return `seat-sync:${subscriptionItemId}:${String(seatCount)}:${String(bucket)}`;
}

export function resolveBillingPriceId(cadence: BillingCadence, config: BillingConfig): string {
  if (cadence === 'annual') {
    return config.stripeAnnualPriceId ?? config.stripePriceId;
  }
  return config.stripeMonthlyPriceId ?? config.stripePriceId;
}

export function resolveBillingPriceIds(config: BillingConfig): string[] {
  const ids = new Set<string>();
  ids.add(config.stripePriceId);
  if (config.stripeMonthlyPriceId) {
    ids.add(config.stripeMonthlyPriceId);
  }
  if (config.stripeAnnualPriceId) {
    ids.add(config.stripeAnnualPriceId);
  }
  return Array.from(ids);
}

export function resolveBillingPreferences(
  settings: OrgSettings,
  config: BillingConfig,
): { priceId: string; customerEmail?: string } {
  const billingEmail = settings.billing.billingEmail.trim();
  return {
    priceId: resolveBillingPriceId(settings.billing.billingCadence, config),
    customerEmail: billingEmail.length > 0 ? billingEmail : undefined,
  };
}
