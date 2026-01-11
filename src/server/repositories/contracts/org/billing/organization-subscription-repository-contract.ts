import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type {
  BillingSubscriptionStatus,
  OrganizationSubscriptionData,
} from '@/server/types/billing-types';

export interface OrganizationSubscriptionUpsertInput {
  orgId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string | null;
  stripePriceId: string;
  status: BillingSubscriptionStatus;
  seatCount: number;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeEventCreatedAt?: Date | null;
  metadata?: Record<string, string> | null;
}

export interface IOrganizationSubscriptionRepository {
  getByOrgId(
    context: RepositoryAuthorizationContext,
    orgId: string,
  ): Promise<OrganizationSubscriptionData | null>;

  getByStripeCustomerId(stripeCustomerId: string): Promise<OrganizationSubscriptionData | null>;

  getByStripeSubscriptionId(stripeSubscriptionId: string): Promise<OrganizationSubscriptionData | null>;

  upsertSubscription(
    context: RepositoryAuthorizationContext,
    input: OrganizationSubscriptionUpsertInput,
  ): Promise<OrganizationSubscriptionData>;

  updateSeatCount(
    context: RepositoryAuthorizationContext,
    orgId: string,
    seatCount: number,
  ): Promise<OrganizationSubscriptionData>;
}
