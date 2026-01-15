import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { onboardPlatformTenantController } from '@/server/api-adapters/platform/tenant-onboarding-controller';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await onboardPlatformTenantController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
