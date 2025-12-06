import { NextResponse } from 'next/server';
import { z } from 'zod';
import { approveLeaveRequestController } from '@/server/api-adapters/hr/leave/approve-leave-request';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

const approveBodySchema = z.object({
    requestId: z.uuid(),
});

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const parsed = approveBodySchema.parse(await request.clone().json());
        const result = await approveLeaveRequestController({ request, requestId: parsed.requestId });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
