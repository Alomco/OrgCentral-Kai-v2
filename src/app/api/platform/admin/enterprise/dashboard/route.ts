import { NextResponse } from 'next/server';
import { getEnterpriseDashboardController } from '@/server/api-adapters/platform/admin/enterprise-dashboard-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await getEnterpriseDashboardController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
