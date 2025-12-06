import { NextResponse } from 'next/server';
import { submitLeaveRequestController } from '@/server/api-adapters/hr/leave/submit-leave-request';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await submitLeaveRequestController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
