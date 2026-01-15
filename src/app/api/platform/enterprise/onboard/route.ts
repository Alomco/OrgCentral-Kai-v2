import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { onboardEnterpriseTenantController } from '@/server/api-adapters/platform/enterprise-onboarding-controller';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await onboardEnterpriseTenantController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
