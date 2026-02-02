import { NextResponse } from 'next/server';
import { requestBreakGlassController } from '@/server/api-adapters/platform/admin/break-glass-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function POST(request: Request) {
    try {
        const result = await requestBreakGlassController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
