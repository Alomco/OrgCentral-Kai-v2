import { NextResponse } from 'next/server';
import { approveBreakGlassController } from '@/server/api-adapters/platform/admin/break-glass-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function POST(request: Request) {
    try {
        const result = await approveBreakGlassController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
