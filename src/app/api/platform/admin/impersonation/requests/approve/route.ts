import { NextResponse } from 'next/server';
import { approveImpersonationController } from '@/server/api-adapters/platform/admin/impersonation-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function POST(request: Request) {
    try {
        const result = await approveImpersonationController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
