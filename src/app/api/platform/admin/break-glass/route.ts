import { NextResponse } from 'next/server';
import { listBreakGlassApprovalsController } from '@/server/api-adapters/platform/admin/break-glass-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listBreakGlassApprovalsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
