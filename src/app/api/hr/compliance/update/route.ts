import { NextResponse } from 'next/server';
import { updateComplianceItemController } from '@/server/api-adapters/hr/compliance/update-compliance-item';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function PATCH(request: Request): Promise<NextResponse> {
    try {
        const result = await updateComplianceItemController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
