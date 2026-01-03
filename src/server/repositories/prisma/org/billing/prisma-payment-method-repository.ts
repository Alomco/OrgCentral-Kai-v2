import { Prisma } from '@prisma/client';

import type {
  IPaymentMethodRepository,
  PaymentMethodUpsertInput,
} from '@/server/repositories/contracts/org/billing';
import type { PaymentMethodData } from '@/server/types/billing-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import { getModelDelegate, runTransaction, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapPaymentMethodToData } from '@/server/repositories/mappers/org/billing/payment-method-mapper';
import { CACHE_SCOPE_BILLING_PAYMENT_METHODS } from '@/server/repositories/cache-scopes';

const PAYMENT_METHOD_NOT_FOUND = 'Payment method not found.';

export class PrismaPaymentMethodRepository
  extends OrgScopedPrismaRepository
  implements IPaymentMethodRepository {
  async listByOrgId(
    context: RepositoryAuthorizationContext,
    orgId: string,
  ): Promise<PaymentMethodData[]> {
    if (orgId !== context.orgId) {
      throw new Error('Cross-tenant payment method list rejected.');
    }
    this.tagCache(context, CACHE_SCOPE_BILLING_PAYMENT_METHODS);
    const records = await getModelDelegate(this.prisma, 'paymentMethod').findMany({
      where: { orgId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map(mapPaymentMethodToData);
  }

  async getByStripeId(
    context: RepositoryAuthorizationContext,
    stripePaymentMethodId: string,
  ): Promise<PaymentMethodData | null> {
    this.tagCache(context, CACHE_SCOPE_BILLING_PAYMENT_METHODS);
    const record = await getModelDelegate(this.prisma, 'paymentMethod').findUnique({
      where: { stripePaymentMethodId },
    });
    if (!record) {
      return null;
    }
    this.assertTenantRecord(record, context.orgId);
    return mapPaymentMethodToData(record);
  }

  async upsertPaymentMethod(
    context: RepositoryAuthorizationContext,
    input: PaymentMethodUpsertInput,
  ): Promise<PaymentMethodData> {
    if (input.orgId !== context.orgId) {
      throw new Error('Cross-tenant payment method update rejected.');
    }

    const metadata =
      input.metadata && Object.keys(input.metadata).length > 0
        ? toPrismaInputJson(input.metadata)
        : Prisma.JsonNull;

    const record = await runTransaction(this.prisma, async (tx) => {
      if (input.isDefault) {
        await getModelDelegate(tx, 'paymentMethod').updateMany({
          where: { orgId: input.orgId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return getModelDelegate(tx, 'paymentMethod').upsert({
        where: { stripePaymentMethodId: input.stripePaymentMethodId },
        create: {
          orgId: input.orgId,
          stripePaymentMethodId: input.stripePaymentMethodId,
          type: input.type,
          last4: input.last4,
          brand: input.brand ?? null,
          bankName: input.bankName ?? null,
          expiryMonth: input.expiryMonth ?? null,
          expiryYear: input.expiryYear ?? null,
          isDefault: input.isDefault,
          metadata,
          dataClassification: context.dataClassification,
          residencyTag: context.dataResidency,
        },
        update: {
          type: input.type,
          last4: input.last4,
          brand: input.brand ?? null,
          bankName: input.bankName ?? null,
          expiryMonth: input.expiryMonth ?? null,
          expiryYear: input.expiryYear ?? null,
          isDefault: input.isDefault,
          metadata,
          dataClassification: context.dataClassification,
          residencyTag: context.dataResidency,
        },
      });
    });

    await this.invalidateCache(context, CACHE_SCOPE_BILLING_PAYMENT_METHODS);
    return mapPaymentMethodToData(record);
  }

  async setDefaultPaymentMethod(
    context: RepositoryAuthorizationContext,
    orgId: string,
    stripePaymentMethodId: string,
  ): Promise<void> {
    if (orgId !== context.orgId) {
      throw new Error('Cross-tenant payment method update rejected.');
    }

    const existing = await getModelDelegate(this.prisma, 'paymentMethod').findUnique({
      where: { stripePaymentMethodId },
    });
    if (!existing) {
      throw new Error(PAYMENT_METHOD_NOT_FOUND);
    }
    this.assertTenantRecord(existing, context.orgId);

    await runTransaction(this.prisma, async (tx) => {
      await getModelDelegate(tx, 'paymentMethod').updateMany({
        where: { orgId, isDefault: true },
        data: { isDefault: false },
      });
      await getModelDelegate(tx, 'paymentMethod').update({
        where: { stripePaymentMethodId },
        data: {
          isDefault: true,
          dataClassification: context.dataClassification,
          residencyTag: context.dataResidency,
        },
      });
    });

    await this.invalidateCache(context, CACHE_SCOPE_BILLING_PAYMENT_METHODS);
  }

  async removePaymentMethod(
    context: RepositoryAuthorizationContext,
    orgId: string,
    stripePaymentMethodId: string,
  ): Promise<void> {
    if (orgId !== context.orgId) {
      throw new Error('Cross-tenant payment method removal rejected.');
    }

    const existing = await getModelDelegate(this.prisma, 'paymentMethod').findUnique({
      where: { stripePaymentMethodId },
    });
    if (!existing) {
      throw new Error(PAYMENT_METHOD_NOT_FOUND);
    }
    this.assertTenantRecord(existing, context.orgId);

    await getModelDelegate(this.prisma, 'paymentMethod').delete({
      where: { stripePaymentMethodId },
    });
    await this.invalidateCache(context, CACHE_SCOPE_BILLING_PAYMENT_METHODS);
  }
}
