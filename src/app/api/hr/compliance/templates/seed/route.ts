import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { seedComplianceTemplatesController } from '@/server/api-adapters/hr/compliance/seed-default-templates';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await seedComplianceTemplatesController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
