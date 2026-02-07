import { z } from 'zod';

interface BillingRedirectResponse {
  success: true;
  url: string;
}

const billingRedirectResponseSchema = z.object({
  success: z.literal(true),
  url: z.string().url(),
});

export async function createBillingCheckout(orgId: string): Promise<BillingRedirectResponse> {
  const res = await fetch(`/api/org/${orgId}/billing/checkout`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to start checkout');
  }
  const data = billingRedirectResponseSchema.parse(await res.json());
  return { success: true, url: data.url };
}

export async function createBillingPortal(orgId: string): Promise<BillingRedirectResponse> {
  const res = await fetch(`/api/org/${orgId}/billing/portal`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to open billing portal');
  }
  const data = billingRedirectResponseSchema.parse(await res.json());
  return { success: true, url: data.url };
}
