import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type {
  IBillingInvoiceRepository,
  IOrganizationSubscriptionRepository,
  IPaymentMethodRepository,
  BillingInvoiceListFilters,
} from '@/server/repositories/contracts/org/billing';
import type { BillingInvoiceData, OrganizationSubscriptionData, PaymentMethodData } from '@/server/types/billing-types';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import type {
  BillingInvoicePreview,
  BillingGateway,
  BillingWebhookEvent,
} from '@/server/services/billing/billing-gateway';
import type { BillingConfig } from '@/server/services/billing/billing-config';
import { type BillingCadence } from '@/server/services/billing/billing-preferences';
import { syncBillingSubscriptionPreferences } from '@/server/services/billing/billing-subscription-sync';
import { loadOrgSettings } from '@/server/services/org/settings/org-settings-store';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';
import {
  createCheckoutSessionOperation,
  createPortalSessionOperation,
  syncSeatsOperation,
} from '@/server/services/billing/billing-service.subscription-operations';
import {
  createSetupIntentOperation,
  listPaymentMethodsOperation,
  removePaymentMethodOperation,
  setDefaultPaymentMethodOperation,
} from '@/server/services/billing/billing-service.payment-method-operations';
import {
  getInvoiceOperation,
  listInvoicesOperation,
  previewUpcomingInvoiceOperation,
} from '@/server/services/billing/billing-service.invoice-operations';
import { handleBillingWebhookEvent } from '@/server/services/billing/billing-service.webhook-handler';

export interface BillingServiceDependencies {
  subscriptionRepository: IOrganizationSubscriptionRepository;
  membershipRepository: IMembershipRepository;
  organizationRepository: IOrganizationRepository;
  paymentMethodRepository: IPaymentMethodRepository;
  billingInvoiceRepository: IBillingInvoiceRepository;
  billingGateway: BillingGateway;
  billingConfig: BillingConfig;
  orgSettingsLoader?: (orgId: string) => Promise<OrgSettings>;
}

interface BillingAuthorizationInput { authorization: RepositoryAuthorizationContext }
interface BillingCheckoutInput extends BillingAuthorizationInput { customerEmail?: string | null }
interface BillingPaymentMethodInput extends BillingAuthorizationInput { paymentMethodId: string }
interface BillingInvoiceListInput extends BillingAuthorizationInput { filters?: BillingInvoiceListFilters }
interface BillingInvoiceInput extends BillingAuthorizationInput { invoiceId: string }

export class BillingService extends AbstractOrgService {
  private readonly deps: BillingServiceDependencies;
  private readonly orgSettingsLoader: (orgId: string) => Promise<OrgSettings>;
  constructor(deps: BillingServiceDependencies) {
    super();
    this.deps = deps;
    this.orgSettingsLoader = deps.orgSettingsLoader ?? loadOrgSettings;
  }

  async createCheckoutSession(input: BillingCheckoutInput): Promise<{ url: string }> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['update'] },
      action: 'org.billing.checkout',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.checkout.create', () =>
      createCheckoutSessionOperation(this.deps, this.orgSettingsLoader, input),
    );
  }

  async createPortalSession(input: BillingAuthorizationInput): Promise<{ url: string }> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['update'] },
      action: 'org.billing.portal',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.portal.create', () =>
      createPortalSessionOperation(this.deps, input),
    );
  }

  async getSubscription(input: BillingAuthorizationInput): Promise<OrganizationSubscriptionData | null> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['read'] },
      action: 'org.billing.read',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.subscription.get', () =>
      this.deps.subscriptionRepository.getByOrgId(input.authorization, input.authorization.orgId),
    );
  }

  async syncSeats(input: BillingAuthorizationInput): Promise<void> {
    const context = this.buildContext(input.authorization);
    await this.executeInServiceContext(context, 'billing.seats.sync', () =>
      syncSeatsOperation(this.deps, this.orgSettingsLoader, input),
    );
  }

  async syncSubscriptionPreferences(input: {
    authorization: RepositoryAuthorizationContext;
    billingCadence: BillingCadence;
    autoRenew: boolean;
  }): Promise<void> {
    const context = this.buildContext(input.authorization);
    await this.executeInServiceContext(context, 'billing.subscription.preferences.sync', () =>
      syncBillingSubscriptionPreferences(
        {
          subscriptionRepository: this.deps.subscriptionRepository,
          billingGateway: this.deps.billingGateway,
          billingConfig: this.deps.billingConfig,
        },
        input,
      ),
    );
  }

  async createSetupIntent(input: BillingAuthorizationInput): Promise<{ clientSecret: string }> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['update'] },
      action: 'org.billing.payment_method.create',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.setup-intent.create', () =>
      createSetupIntentOperation(this.deps, input),
    );
  }

  async listPaymentMethods(input: BillingAuthorizationInput): Promise<PaymentMethodData[]> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['read'] },
      action: 'org.billing.payment_method.list',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.payment-methods.list', () =>
      listPaymentMethodsOperation(this.deps, input),
    );
  }

  async setDefaultPaymentMethod(input: BillingPaymentMethodInput): Promise<void> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['update'] },
      action: 'org.billing.payment_method.update',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    await this.executeInServiceContext(context, 'billing.payment-methods.default', () =>
      setDefaultPaymentMethodOperation(this.deps, input),
    );
  }

  async removePaymentMethod(input: BillingPaymentMethodInput): Promise<void> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['update'] },
      action: 'org.billing.payment_method.delete',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    await this.executeInServiceContext(context, 'billing.payment-methods.detach', () =>
      removePaymentMethodOperation(this.deps, input),
    );
  }

  async listInvoices(input: BillingInvoiceListInput): Promise<BillingInvoiceData[]> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['read'] },
      action: 'org.billing.invoice.list',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.invoices.list', () =>
      listInvoicesOperation(this.deps, input),
    );
  }

  async getInvoice(input: BillingInvoiceInput): Promise<BillingInvoiceData | null> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['read'] },
      action: 'org.billing.invoice.read',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.invoices.get', () =>
      getInvoiceOperation(this.deps, input),
    );
  }

  async getUpcomingInvoice(input: BillingAuthorizationInput): Promise<BillingInvoicePreview | null> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: { organization: ['read'] },
      action: 'org.billing.invoice.preview',
      resourceType: ORG_BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: input.authorization.orgId },
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'billing.invoices.upcoming', () =>
      previewUpcomingInvoiceOperation(this.deps, input),
    );
  }

  async handleWebhookEvent(event: BillingWebhookEvent): Promise<{ received: true }> {
    return handleBillingWebhookEvent(this.deps, event);
  }
}

const ORG_BILLING_RESOURCE_TYPE = 'org.billing';
