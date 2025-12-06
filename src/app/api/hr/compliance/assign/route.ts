import { NextResponse } from 'next/server';
import { assignComplianceItemsController } from '@/server/api-adapters/hr/compliance/assign-compliance-items';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await assignComplianceItemsController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
