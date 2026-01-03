import { z } from 'zod';

export interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePriceId: string;
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
  stripeSuccessUrl: string;
  stripeCancelUrl: string;
  stripePortalReturnUrl?: string;
  stripeApiVersion?: string;
  stripeEnableBacsDebit?: boolean;
  stripeEnableSepaDebit?: boolean;
}

const billingConfigSchema = z.object({
  stripeSecretKey: z.string().min(1),
  stripeWebhookSecret: z.string().min(1),
  stripePriceId: z.string().min(1),
  stripeMonthlyPriceId: z.string().min(1).optional(),
  stripeAnnualPriceId: z.string().min(1).optional(),
  stripeSuccessUrl: z.url(),
  stripeCancelUrl: z.url(),
  stripePortalReturnUrl: z.url().optional(),
  stripeApiVersion: z.string().min(1).optional(),
});

export function resolveBillingConfig(): BillingConfig | null {
  const parsed = billingConfigSchema.safeParse({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceId: process.env.STRIPE_PRICE_ID,
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_ID_MONTHLY,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_ANNUAL,
    stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL,
    stripeCancelUrl: process.env.STRIPE_CANCEL_URL,
    stripePortalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL,
    stripeApiVersion: process.env.STRIPE_API_VERSION,
  });

  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    stripeEnableBacsDebit: parseBooleanEnvironment(process.env.STRIPE_ENABLE_BACS_DEBIT),
    stripeEnableSepaDebit: parseBooleanEnvironment(process.env.STRIPE_ENABLE_SEPA_DEBIT),
  };
}

export function requireBillingConfig(): BillingConfig {
  const config = resolveBillingConfig();
  if (!config) {
    throw new Error('Billing is not configured. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_ID.');
  }
  return config;
}

function parseBooleanEnvironment(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return undefined;
}
