import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createAuth } from '@/server/lib/auth';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { appendSetCookieHeaders } from '@/server/api-adapters/http/set-cookie-headers';
import { runAdminBootstrap } from '@/server/use-cases/auth/admin-bootstrap';

const requestSchema = z.object({
    token: z.string().min(1),
});


export async function POST(request: NextRequest): Promise<Response> {
    try {
        const payload = requestSchema.parse(await request.json());
        const auth = createAuth(request.nextUrl.origin);
        const result = await runAdminBootstrap(
            { auth },
            {
                token: payload.token,
                requestHeaders: request.headers,
            },
        );

        const response = NextResponse.json({
            ok: true,
            orgId: result.orgId,
            role: result.role,
            redirectTo: result.redirectTo,
        });

        appendSetCookieHeaders(result.setActiveHeaders, response.headers);
        return response;
    } catch (error) {
        return buildErrorResponse(error);
    }
}
