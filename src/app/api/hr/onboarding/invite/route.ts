import { NextResponse } from 'next/server';
import { inviteEmployeeController } from '@/server/api-adapters/hr/onboarding/invite-employee';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await inviteEmployeeController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
