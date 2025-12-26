import { NextResponse } from 'next/server';

import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { createOrganizationController } from '@/server/api-adapters/org/organization/organization-route-controllers';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        return NextResponse.json(await createOrganizationController(request), { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
