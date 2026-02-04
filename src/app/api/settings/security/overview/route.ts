import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getSecurityOverviewAdapter } from '@/server/api-adapters/settings/security/get-security-overview';
import { securityOverviewSchema } from '@/lib/schemas/security-overview';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

function noStoreJson<TBody>(body: TBody, init?: { status?: number }): NextResponse<TBody> {
    return NextResponse.json(body, {
        status: init?.status ?? 200,
        headers: { 'Cache-Control': 'no-store' },
    });
}

export async function GET(request: Request): Promise<Response> {
    noStore();
    try {
        const { session, authorization } = await getSessionContext(
            {},
            {
                headers: request.headers,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'api:settings:security:overview',
            },
        );

        const overview = await getSecurityOverviewAdapter({
            authorization,
            currentSessionToken: session.session.token,
        });

        const payload = securityOverviewSchema.parse(overview);
        return noStoreJson(payload);
    } catch (error) {
        return buildErrorResponse(error);
    }
}
