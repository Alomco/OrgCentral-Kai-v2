import { NextResponse } from 'next/server';

import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { setDefaultBillingPaymentMethodController } from '@/server/api-adapters/org/billing/billing-payment-method-controllers';

interface RouteParams {
  params: { orgId: string; pmId: string };
}

export async function POST(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const result = await setDefaultBillingPaymentMethodController(
      request,
      context.params.orgId,
      context.params.pmId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
