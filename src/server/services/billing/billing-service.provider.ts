import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { PrismaMembershipRepository } from '@/server/repositories/prisma/org/membership/prisma-membership-repository';
import {
  PrismaBillingInvoiceRepository,
  PrismaOrganizationSubscriptionRepository,
  PrismaPaymentMethodRepository,
} from '@/server/repositories/prisma/org/billing';
import { resolveBillingConfig } from '@/server/services/billing/billing-config';
import { StripeBillingGateway } from '@/server/services/billing/stripe-billing-gateway';
import { BillingService, type BillingServiceDependencies } from '@/server/services/billing/billing-service';

let sharedService: BillingService | null = null;

export function resolveBillingService(
  overrides?: Partial<BillingServiceDependencies>,
  options?: { prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'> },
): BillingService | null {
  const billingConfig = overrides?.billingConfig ?? resolveBillingConfig();
  if (!billingConfig) {
    return null;
  }

  const prismaClient = options?.prismaOptions?.prisma ?? defaultPrismaClient;
  const repoOptions = {
    prisma: prismaClient,
    trace: options?.prismaOptions?.trace,
    onAfterWrite: options?.prismaOptions?.onAfterWrite,
  } satisfies BasePrismaRepositoryOptions;

  const defaultDependencies: BillingServiceDependencies = {
    subscriptionRepository: new PrismaOrganizationSubscriptionRepository(repoOptions),
    membershipRepository: new PrismaMembershipRepository(repoOptions),
    organizationRepository: new PrismaOrganizationRepository({ prisma: prismaClient }),
    paymentMethodRepository: new PrismaPaymentMethodRepository(repoOptions),
    billingInvoiceRepository: new PrismaBillingInvoiceRepository(repoOptions),
    billingGateway: new StripeBillingGateway(billingConfig),
    billingConfig,
  };

  if (!overrides || Object.keys(overrides).length === 0) {
    sharedService ??= new BillingService(defaultDependencies);
    return sharedService;
  }

  return new BillingService({
    ...defaultDependencies,
    ...overrides,
  });
}

export function getBillingService(
  overrides?: Partial<BillingServiceDependencies>,
  options?: { prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'> },
): BillingService {
  const service = resolveBillingService(overrides, options);
  if (!service) {
    throw new Error('Billing is not configured.');
  }
  return service;
}

export type BillingServiceContract = Pick<
  BillingService,
  | 'createCheckoutSession'
  | 'createPortalSession'
  | 'getSubscription'
  | 'syncSeats'
  | 'syncSubscriptionPreferences'
  | 'createSetupIntent'
  | 'listPaymentMethods'
  | 'setDefaultPaymentMethod'
  | 'removePaymentMethod'
  | 'listInvoices'
  | 'getInvoice'
  | 'getUpcomingInvoice'
  | 'handleWebhookEvent'
>;
