import type { PaymentMethod } from '@prisma/client';

import type { PaymentMethodData } from '@/server/types/billing-types';

export function mapPaymentMethodToData(method: PaymentMethod): PaymentMethodData {
  return {
    id: method.id,
    orgId: method.orgId,
    stripePaymentMethodId: method.stripePaymentMethodId,
    type: method.type,
    last4: method.last4,
    brand: method.brand ?? null,
    bankName: method.bankName ?? null,
    expiryMonth: method.expiryMonth ?? null,
    expiryYear: method.expiryYear ?? null,
    isDefault: method.isDefault,
    dataClassification: method.dataClassification,
    dataResidency: method.residencyTag,
    auditSource: 'billing-repository',
    auditBatchId: undefined,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
  };
}
