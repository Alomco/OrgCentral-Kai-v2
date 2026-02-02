import { NextResponse } from 'next/server';
import { getTenantDetailController } from '@/server/api-adapters/platform/admin/tenants-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

interface TenantRouteParams {
    tenantId: string;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<TenantRouteParams> },
) {
    try {
        const { tenantId } = await params;
        const result = await getTenantDetailController(request, tenantId);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
