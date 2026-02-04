import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';

import { auth } from '@/server/lib/auth';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';

const CREDENTIAL_PROVIDER_ID = 'credential';

export async function GET(request: Request): Promise<Response> {
    noStore();
    try {
        await getSessionContext({}, {
            headers: request.headers,
            auditSource: 'api:auth:password-status',
        });

        const accounts = await auth.api.listUserAccounts({
            headers: request.headers,
        });

        const providers = accounts.map((account) => account.providerId);
        const hasPassword = providers.includes(CREDENTIAL_PROVIDER_ID);

        return NextResponse.json({ hasPassword, providers }, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
