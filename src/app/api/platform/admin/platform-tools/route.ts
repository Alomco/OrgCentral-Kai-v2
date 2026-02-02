import { NextResponse } from 'next/server';
import { listPlatformToolsController } from '@/server/api-adapters/platform/admin/platform-tools-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listPlatformToolsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
