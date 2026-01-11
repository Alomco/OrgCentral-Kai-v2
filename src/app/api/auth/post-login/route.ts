import { NextResponse, type NextRequest } from 'next/server';

import { createAuth } from '@/server/lib/auth';
import { appendSetCookieHeaders } from '@/server/api-adapters/http/set-cookie-headers';
import { handlePostLogin } from '@/server/use-cases/auth/post-login';

async function handlePostLoginRequest(request: NextRequest): Promise<NextResponse> {
    const auth = createAuth(request.nextUrl.origin);
    const result = await handlePostLogin(
        { auth },
        { headers: request.headers, requestUrl: new URL(request.nextUrl.href) },
    );
    const response = NextResponse.redirect(result.redirectUrl);
    if (result.setActiveHeaders) {
        appendSetCookieHeaders(result.setActiveHeaders, response.headers);
    }
    return response;
}

export async function GET(request: NextRequest): Promise<Response> {
    return handlePostLoginRequest(request);
}

export async function POST(request: NextRequest): Promise<Response> {
    return handlePostLoginRequest(request);
}
