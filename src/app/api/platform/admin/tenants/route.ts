import { NextResponse } from 'next/server';
import { listTenantsController, updateTenantStatusController } from '@/server/api-adapters/platform/admin/tenants-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listTenantsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const result = await updateTenantStatusController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
