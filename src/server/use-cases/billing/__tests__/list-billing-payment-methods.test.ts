import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveBillingServiceMock } = vi.hoisted(() => ({
  resolveBillingServiceMock: vi.fn(),
}));

vi.mock('@/server/services/billing/billing-service.provider', () => ({
  resolveBillingService: resolveBillingServiceMock,
}));

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingServiceContract } from '@/server/services/billing/billing-service.provider';
import type { PaymentMethodData } from '@/server/types/billing-types';
import { listBillingPaymentMethods } from '@/server/use-cases/billing/list-billing-payment-methods';

const authorization: RepositoryAuthorizationContext = {
  orgId: '11111111-1111-4111-8111-111111111001',
  userId: '11111111-1111-4111-8111-111111111002',
  roleKey: 'custom',
  permissions: {},
  dataResidency: 'UK_ONLY',
  dataClassification: 'OFFICIAL',
  auditSource: 'test',
  tenantScope: {
    orgId: '11111111-1111-4111-8111-111111111001',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
  },
};

describe('listBillingPaymentMethods', () => {
  beforeEach(() => {
    resolveBillingServiceMock.mockReset();
  });

  it('returns billingConfigured=false when billing service is unavailable', async () => {
    resolveBillingServiceMock.mockReturnValue(null);

    const result = await listBillingPaymentMethods({}, { authorization });

    expect(result).toEqual({
      paymentMethods: [],
      billingConfigured: false,
    });
  });

  it('returns payment methods and billingConfigured=true when service exists', async () => {
    const paymentMethods = [createPaymentMethodData('pm_123')];
    const service = createBillingServiceContract(paymentMethods);

    const result = await listBillingPaymentMethods({ service }, { authorization });

    expect(result).toEqual({
      paymentMethods,
      billingConfigured: true,
    });
    expect(service.listPaymentMethods).toHaveBeenCalledWith({ authorization });
  });
});

function createBillingServiceContract(paymentMethods: PaymentMethodData[]): BillingServiceContract {
  return {
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    getSubscription: vi.fn(),
    syncSeats: vi.fn(),
    syncSubscriptionPreferences: vi.fn(),
    createSetupIntent: vi.fn(),
    listPaymentMethods: vi.fn().mockResolvedValue(paymentMethods),
    setDefaultPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    listInvoices: vi.fn(),
    getInvoice: vi.fn(),
    getUpcomingInvoice: vi.fn(),
    handleWebhookEvent: vi.fn(),
  };
}

function createPaymentMethodData(paymentMethodId: string): PaymentMethodData {
  return {
    id: `pm_local_${paymentMethodId}`,
    orgId: authorization.orgId,
    stripePaymentMethodId: paymentMethodId,
    type: 'CARD',
    last4: '4242',
    brand: 'visa',
    bankName: null,
    expiryMonth: 12,
    expiryYear: 2030,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    auditBatchId: undefined,
  };
}
