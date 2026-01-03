import { z } from 'zod';

import { ValidationError } from '@/server/errors';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createBillingSetupIntent } from '@/server/use-cases/billing/create-billing-setup-intent';
import { listBillingPaymentMethods } from '@/server/use-cases/billing/list-billing-payment-methods';
import { removeBillingPaymentMethod } from '@/server/use-cases/billing/remove-billing-payment-method';
import { setDefaultBillingPaymentMethod } from '@/server/use-cases/billing/set-default-billing-payment-method';
import type { PaymentMethodData } from '@/server/types/billing-types';

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';
const PAYMENT_METHOD_ID_REQUIRED_MESSAGE = 'Payment method id is required.';
const BILLING_RESOURCE_TYPE = 'org.billing';
const setupIntentRequestSchema = z.object({}).strict();
const listRequestSchema = z.object({}).strict();

export interface BillingSetupIntentResult {
  success: true;
  clientSecret: string;
}

export interface BillingPaymentMethodsResult {
  success: true;
  paymentMethods: PaymentMethodData[];
}

export async function createBillingSetupIntentController(
  request: Request,
  orgId: string,
): Promise<BillingSetupIntentResult> {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const body = await readJson(request);
  setupIntentRequestSchema.parse(body);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'api:org:billing:setup-intent',
      action: 'org.billing.payment_method.create',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId },
    },
  );

  const result = await createBillingSetupIntent({}, { authorization });

  return { success: true, clientSecret: result.clientSecret };
}

export async function listBillingPaymentMethodsController(
  request: Request,
  orgId: string,
): Promise<BillingPaymentMethodsResult> {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  listRequestSchema.parse({});

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['read'] },
      auditSource: 'api:org:billing:payment-methods:list',
      action: 'org.billing.payment_method.list',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId },
    },
  );

  const result = await listBillingPaymentMethods({}, { authorization });

  return { success: true, paymentMethods: result.paymentMethods };
}

export async function removeBillingPaymentMethodController(
  request: Request,
  orgId: string,
  paymentMethodId: string,
): Promise<{ success: true }> {
  const normalizedOrgId = orgId.trim();
  const normalizedPaymentMethodId = paymentMethodId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedPaymentMethodId) {
    throw new ValidationError(PAYMENT_METHOD_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'api:org:billing:payment-methods:remove',
      action: 'org.billing.payment_method.delete',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId, paymentMethodId: normalizedPaymentMethodId },
    },
  );

  await removeBillingPaymentMethod({}, { authorization, paymentMethodId: normalizedPaymentMethodId });

  return { success: true };
}

export async function setDefaultBillingPaymentMethodController(
  request: Request,
  orgId: string,
  paymentMethodId: string,
): Promise<{ success: true }> {
  const normalizedOrgId = orgId.trim();
  const normalizedPaymentMethodId = paymentMethodId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedPaymentMethodId) {
    throw new ValidationError(PAYMENT_METHOD_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'api:org:billing:payment-methods:default',
      action: 'org.billing.payment_method.update',
      resourceType: BILLING_RESOURCE_TYPE,
      resourceAttributes: { orgId: normalizedOrgId, paymentMethodId: normalizedPaymentMethodId },
    },
  );

  await setDefaultBillingPaymentMethod({}, { authorization, paymentMethodId: normalizedPaymentMethodId });

  return { success: true };
}
