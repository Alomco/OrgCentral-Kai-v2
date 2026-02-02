import { NextResponse } from 'next/server';
import { listImpersonationSessionsController } from '@/server/api-adapters/platform/admin/impersonation-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listImpersonationSessionsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
