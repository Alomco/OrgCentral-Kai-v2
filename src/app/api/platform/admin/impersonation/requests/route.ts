import { NextResponse } from 'next/server';
import {
    listImpersonationRequestsController,
    requestImpersonationController,
} from '@/server/api-adapters/platform/admin/impersonation-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listImpersonationRequestsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const result = await requestImpersonationController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
