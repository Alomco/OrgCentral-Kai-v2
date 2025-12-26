import { NextResponse } from 'next/server';
import { listComplianceItemsGroupedController } from '@/server/api-adapters/hr/compliance/list-compliance-items-grouped';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const result = await listComplianceItemsGroupedController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
