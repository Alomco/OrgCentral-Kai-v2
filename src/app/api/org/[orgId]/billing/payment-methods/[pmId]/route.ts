import { NextResponse } from 'next/server';

import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { removeBillingPaymentMethodController } from '@/server/api-adapters/org/billing/billing-payment-method-controllers';

interface RouteParams {
  params: { orgId: string; pmId: string };
}

export async function DELETE(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const result = await removeBillingPaymentMethodController(
      request,
      context.params.orgId,
      context.params.pmId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
