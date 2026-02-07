import { describe, expect, it, vi } from 'vitest';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { BillingServiceDependencies } from '@/server/services/billing/billing-service';
import type { PaymentMethodSummary } from '@/server/services/billing/billing-gateway';
import { removePaymentMethodOperation } from '@/server/services/billing/billing-service.payment-method-operations';
import type { PaymentMethodData } from '@/server/types/billing-types';

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

describe('billing-service payment-method sync retry', () => {
  it('syncs from Stripe and retries local lookup once when payment method is missing', async () => {
    const deps = buildDependencies({
      localLookupSequence: [null, createLocalPaymentMethod('pm_123')],
      stripeListedMethods: [createStripePaymentMethodSummary('pm_123')],
    });

    await removePaymentMethodOperation(deps, {
      authorization,
      paymentMethodId: 'pm_123',
    });

    expect(deps.billingGateway.listPaymentMethods).toHaveBeenCalledTimes(1);
    expect(deps.billingGateway.listPaymentMethods).toHaveBeenCalledWith('cus_org');
    expect(deps.paymentMethodRepository.getByStripeId).toHaveBeenCalledTimes(2);
    expect(deps.billingGateway.detachPaymentMethod).toHaveBeenCalledWith('pm_123');
    expect(deps.paymentMethodRepository.removePaymentMethod).toHaveBeenCalledWith(
      authorization,
      authorization.orgId,
      'pm_123',
    );
  });

  it('fails after one sync retry when payment method is still missing locally', async () => {
    const deps = buildDependencies({
      localLookupSequence: [null, null],
      stripeListedMethods: [],
    });

    await expect(
      removePaymentMethodOperation(deps, {
        authorization,
        paymentMethodId: 'pm_123',
      }),
    ).rejects.toThrow('Payment method not found for this organization.');

    expect(deps.billingGateway.listPaymentMethods).toHaveBeenCalledTimes(1);
    expect(deps.paymentMethodRepository.getByStripeId).toHaveBeenCalledTimes(2);
    expect(deps.billingGateway.detachPaymentMethod).not.toHaveBeenCalled();
  });
});

function buildDependencies(options: {
  localLookupSequence: Array<PaymentMethodData | null>;
  stripeListedMethods: PaymentMethodSummary[];
}): BillingServiceDependencies {
  const getByStripeId = vi.fn();
  for (const localLookup of options.localLookupSequence) {
    getByStripeId.mockResolvedValueOnce(localLookup);
  }

  return {
    subscriptionRepository: {
      getByOrgId: vi.fn().mockResolvedValue({
        id: 'sub_1',
        orgId: authorization.orgId,
        stripeCustomerId: 'cus_org',
        stripeSubscriptionId: 'sub_stripe',
        stripeSubscriptionItemId: 'si_1',
        stripePriceId: 'price_1',
        status: 'ACTIVE',
        seatCount: 1,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        lastStripeEventAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        auditBatchId: undefined,
      }),
      getByStripeCustomerId: vi.fn(),
      getByStripeSubscriptionId: vi.fn(),
      upsertSubscription: vi.fn(),
      updateSeatCount: vi.fn(),
      updatePrice: vi.fn(),
    },
    membershipRepository: {
      findMembership: vi.fn(),
      createMembershipWithProfile: vi.fn(),
      updateMembershipStatus: vi.fn(),
      countActiveMemberships: vi.fn(),
    },
    organizationRepository: {
      getOrganization: vi.fn(),
      getOrganizationBySlug: vi.fn(),
      getLeaveEntitlements: vi.fn(),
      updateLeaveSettings: vi.fn(),
      updateOrganizationProfile: vi.fn(),
      createOrganization: vi.fn(),
      addCustomLeaveType: vi.fn(),
      removeLeaveType: vi.fn(),
      getOrganizationSettings: vi.fn().mockResolvedValue(null),
      updateOrganizationSettings: vi.fn(),
    },
    paymentMethodRepository: {
      listByOrgId: vi.fn(),
      getByStripeId,
      upsertPaymentMethod: vi.fn().mockImplementation(async (_context, input) =>
        createLocalPaymentMethod(input.stripePaymentMethodId),
      ),
      setDefaultPaymentMethod: vi.fn(),
      removePaymentMethod: vi.fn(),
    },
    billingInvoiceRepository: {
      listByOrgId: vi.fn(),
      getByStripeId: vi.fn(),
      getById: vi.fn(),
      upsertInvoice: vi.fn(),
    },
    billingGateway: {
      createCheckoutSession: vi.fn(),
      createCustomer: vi.fn(),
      createSetupIntent: vi.fn(),
      listPaymentMethods: vi.fn().mockResolvedValue(options.stripeListedMethods),
      getPaymentMethodCustomerId: vi.fn().mockResolvedValue('cus_org'),
      detachPaymentMethod: vi.fn(),
      setDefaultPaymentMethod: vi.fn(),
      previewUpcomingInvoice: vi.fn(),
      createPortalSession: vi.fn(),
      updateSubscription: vi.fn(),
      updateSubscriptionSeats: vi.fn(),
      parseWebhookEvent: vi.fn(),
    },
    billingConfig: {
      stripeSecretKey: 'sk_test',
      stripeWebhookSecret: 'whsec_test',
      stripePriceId: 'price_default',
      stripeSuccessUrl: 'https://example.com/success',
      stripeCancelUrl: 'https://example.com/cancel',
      stripeEnableBacsDebit: false,
      stripeEnableSepaDebit: false,
    },
  };
}

function createLocalPaymentMethod(paymentMethodId: string): PaymentMethodData {
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

function createStripePaymentMethodSummary(paymentMethodId: string): PaymentMethodSummary {
  return {
    stripePaymentMethodId: paymentMethodId,
    type: 'CARD',
    last4: '4242',
    brand: 'visa',
    bankName: null,
    expiryMonth: 12,
    expiryYear: 2030,
    isDefault: false,
  };
}
