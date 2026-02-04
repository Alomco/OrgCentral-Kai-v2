import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { listPendingReviewComplianceItemsController } from '@/server/api-adapters/hr/compliance/list-pending-review-items';

export async function GET(request: Request): Promise<NextResponse> {
    noStore();
    try {
        const result = await listPendingReviewComplianceItemsController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
