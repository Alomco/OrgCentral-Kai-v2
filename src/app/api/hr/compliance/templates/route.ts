import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { listComplianceTemplatesController } from '@/server/api-adapters/hr/compliance/list-compliance-templates';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const result = await listComplianceTemplatesController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
