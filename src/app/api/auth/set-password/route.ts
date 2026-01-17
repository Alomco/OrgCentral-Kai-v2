import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/server/lib/auth';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';

const CREDENTIAL_PROVIDER_ID = 'credential';

const requestSchema = z.object({
    newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request): Promise<Response> {
    try {
        await getSessionContext({}, {
            headers: request.headers,
            auditSource: 'api:auth:set-password',
        });

        const payload = requestSchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json({
                message: 'Password must be between 12 and 128 characters.',
            }, { status: 400 });
        }

        const accounts = await auth.api.listUserAccounts({
            headers: request.headers,
        });

        const providers = accounts.map((account) => account.providerId);
        if (providers.includes(CREDENTIAL_PROVIDER_ID)) {
            return NextResponse.json({
                message: 'Password already set for this account.',
            }, { status: 409 });
        }

        await auth.api.setPassword({
            body: {
                newPassword: payload.data.newPassword,
            },
            headers: request.headers,
        });

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
