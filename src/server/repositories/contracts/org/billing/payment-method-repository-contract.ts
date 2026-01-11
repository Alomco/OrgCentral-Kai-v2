import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PaymentMethodData, PaymentMethodType } from '@/server/types/billing-types';

export interface PaymentMethodUpsertInput {
  orgId: string;
  stripePaymentMethodId: string;
  type: PaymentMethodType;
  last4: string;
  brand?: string | null;
  bankName?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault: boolean;
  metadata?: Record<string, string> | null;
}

export interface IPaymentMethodRepository {
  listByOrgId(
    context: RepositoryAuthorizationContext,
    orgId: string,
  ): Promise<PaymentMethodData[]>;

  getByStripeId(
    context: RepositoryAuthorizationContext,
    stripePaymentMethodId: string,
  ): Promise<PaymentMethodData | null>;

  upsertPaymentMethod(
    context: RepositoryAuthorizationContext,
    input: PaymentMethodUpsertInput,
  ): Promise<PaymentMethodData>;

  setDefaultPaymentMethod(
    context: RepositoryAuthorizationContext,
    orgId: string,
    stripePaymentMethodId: string,
  ): Promise<void>;

  removePaymentMethod(
    context: RepositoryAuthorizationContext,
    orgId: string,
    stripePaymentMethodId: string,
  ): Promise<void>;
}
